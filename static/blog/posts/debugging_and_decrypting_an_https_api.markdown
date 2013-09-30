*[SSL]: Secure Socket Layer
*[TLS]: Transport Layer Security

Like most startups, we try to leverage API's to save us time, so we can focus on what really matters, our product. The upside to this approach is fairly self-evident, but what about the downside. What happens when you run face first into a low-level, intermittent bug?

This is the story of our experience with such a bug in the Rackspace Cloudfiles API, and the steps we took to help root cause the problem. While the bug itself may be unique to Rackspace, our approach to debugging it is general and should be helpful to anyone looking to decrypt an HTTPS API from the darkness of the client side.
 
### A Little Background ###
Cloudfiles is a cloud storage service offered by Rackspace. If you're familiar with AWS, think S3. For the purposes of this article, all you really need to know about Cloudfiles is that it's a REST service with an SSL[^1] endpoint.

#### Symptoms ####
When accessing Cloudfiles through a homegrown Python library[^2], we intermittently see a *BadStatusLine* exception from *httplib* on random HTTP requests. In our use case, it's common for us to serially[^3] send multiple HTTP requests across a persistent SSL connection. From the exception, it sounds like one of our requests may not be receiving a proper response.

The fact that we're accessing the Cloudfiles API using a Python library has no bearing on our approach to debugging the problem. I only mention it here for completeness and to possibly help someone else suffering with the same issue.

#### Fanatical Support ####
Rackspace prides themselves on "fanatical support", so you may be thinking why not just throw the details over the wall to Rackspace support and work with them to reproduce and root cause the issue. After all, we are paying for support! I wish!

We've been a Rackspace customer long enough to know that technical support for an intermittent bug is a dead end. Never mind the fact that we're using a homegrown library, and not the officially support Rackspace library.

That being said, let's dig in.

### Investigation ###
Our first thought is that we can't be the only users experiencing this issue. The bug is intermittent, but we're still able to reproduce it several times in a single run of our integration test suite. 

Some googling shows rumblings of intermittent disconnect errors while using the deprecated *python-cloudfiles* library, but that the issue had been fixed in the new official Rackspace library, *pyrax*.

On closer inspection, the *pyrax* library is actually leveraging the *python-swiftclient* library to send HTTP requests to Cloudfiles. Looking at the source code for *python-swiftclient*, we found somewhat excessive retry logic. Each HTTP request is retried 5 times before finally giving up and raising an exception.

The retry logic in *python-swiftclient* smells a bit funny, so let's keep digging.

#### Truth is in the Network Trace ####
Is the Cloudfiles API intermittently sending invalid HTTP responses? Is there a latent bug in Python's *httplib* causing a *BadStatusLine* exception to be thrown for valid HTTP responses? The only way to know for sure, and prove it to others, is to get a network capture of the issue.

Under simpler circumstances we would just fire up *tcpdump* or *Wireshark*, get a capture, and move on with our lives. But as with most reputable API's, Cloudfiles only exposes an SSL endpoint.

An SSL endpoint means that a network capture will only show us encrypted packets, which won't give us the visibility we need. In order to get to the bottom of the issue, we'll need a way to decrypt the SSL traffic in our network capture.

The good news is that *Wireshark* supports decrypting SSL traffic. The bad news is that without the SSL certificate we need to point it to a file containing the master secrets for the SSL sessions for it to decrypt the SSL traffic.

#### Getting at the SSL Master Secret #####
The first step to getting at the SSL master secret is to figure out which SSL library your application is using under the hood. For us that means taking a closer look at our python process.

At this point we should note that we'll be performing our investigation on Mac OS X 10.7.5, but the approach will be very similar on linux. Where possible we'll try and make note of the differences.
<pre><code>
#Start the python interpreter and import the ssl
#module to ensure the ssl library is loaded
$ python
Python 2.7.5 (default, May 19 2013, 13:26:47) 
>>> import ssl

#Find the python interpreter's pid
$ jobs -l
[1]+ 47567 Suspended: 18   python

#List open files for python interpreter which should
#include the shared object for the python ssl module
$ lsof -p 47567 | grep ssl
Python  47567 /opt/local/Library/Frameworks/Python.framework/Versions/2.7/lib/python2.7/lib-dynload/_ssl.so

#List ssl module's library dependencies which should
#include some variant of libssl.
#Note that linux users should replace otool -L w/ ldd
$ otool -L /opt/local/Library/Frameworks/Python.framework/Versions/2.7/lib/python2.7/lib-dynload/_ssl.so
    /opt/local/lib/libssl.1.0.0.dylib
</code></pre>

Above we can see that the python interpreter is using the *libssl* dynamic library for its SSL needs. This is fairly common, and makes our lives a littler easier.

In order to get at the SSL master secrets, we can simply swap out the *libssl* library with a customized version which logs the SSL master secret for each each SSL session. The best part about this approach is that it's extremely non-invasive. We'll be able to swap in our  modified SSL library without changing a single line or our application code!

#### Customizing libssl ####
The first step in customizing *libssl* to log master secrets is to download the source tarball from [openssl](http://www.openssl.org/source/) and extract it.

<pre><code>
$ wget http://www.openssl.org/source/openssl-1.0.0k.tar.gz
Saving to: ‘openssl-1.0.0k.tar.gz’

$ tar xf openssl-1.0.0k.tar.gz 
$ cd openssl-1.0.0k
</code></pre>

Next, we'll modify the *tls1_generate_master_secret()*[^4] function in *ssl/t1_enc.c* to log the master secret for each session to *wireshark_secret.txt*. Add the following lines of code to the end of the *tls1_generate_master_secret()* function immediately before the return statement.

<pre class="prettyprint">
 /* Tech Residents Debug */
 {
     int z;
     FILE *fp = fopen("wireshark_secret.txt", "a+");
     fprintf(fp, "RSA Session-ID:");
     for (int z=0; z&lt;s-&gt;session-&gt;session_id_length; z++) {
         fprintf(fp, "%02X", s->session->session_id[z]);
     }
     fprintf(fp, " Master-Key:");
     for (int z=0; z&lt;sizeof(buff); z++) {
         fprintf(fp, "%02X", s-&gt;session-&gt;master_key[z]);
     }
     fprintf(fp, "\n");
     fclose(fp);
 }
</pre>

Finally, let's rebuild our modified library.
<pre>
openssl-1.0.0k $ ./Configure darwin64-x86_64-cc shared
openssl-1.0.0k $ make && make test
openssl-1.0.0k $ ls -ltr *.dylib
    libcrypto.dylib -> libcrypto.1.0.0.dylib
    libcrypto.1.0.0.dylib
    libssl.dylib -> libssl.1.0.0.dylib
    libssl.1.0.0.dylib
</pre>

Now that we've modified *libssl* to log master secrets, let's swap it in.

#### Swapping in our Customized libssl ####
In order for our application to use our customized version of *libssl* we need to modify the dynamic library path environment variable so that our customized library takes priority over the system's *libssl* library.

<pre><code>
#Note linux users should replace DYLD_LIBRARY_PATH 
#with LD_LIBRARY_PATH
$ DYLD_LIBRARY_PATH=/Users/jmullins/dev/openssl/openssl-1.0.0k:$DYLD_LIBRARY_PATH python test.py
</code></pre>

The above command will invoke our python *test.py* script with an altered *DYLD_LIBRARY_PATH* environment variable forcing it to use our customized version of *libssl*.

#### Capturing and Decrypting the Network Trace ####
We're finally ready to reproduce the bug, using our modified version of *libssl*, and capture a network trace using *Wireshark*.

First, let's fire up *Wireshark* and start capturing packets. 

With that in place, we're ready to run our test script with a modified version of *libssl* which will log the master secrets for each SSL session.

<pre><code>
$ DYLD_LIBRARY_PATH=/Users/jmullins/dev/openssl/openssl-1.0.0k:$DYLD_LIBRARY_PATH python test.py

$ cat wireshark_secret.txt 
RSA Session-ID:AF341963A9843EB461ECB728E0FB15FE27EA63DA4FDE6DDF5435AB7165D457CE Master-Key:CBB9DD417A7393C99479DF80AEBF4884AF5C0D8D479DF97D4734DA71D387A722706D9C44EE8FF08D3AF28A935E291241
RSA Session-ID:D901E8CF0F63D779DA3F32286AAEAB83B7AEF5CBA5BCBEC625934465A765B857 Master-Key:0370EF32982DD6E2862CEB5217EADEB26EDDA2AB2F334132FDFF814EFFD2E7C5E512C507E8E85662330F31CD95FE8466
</code></pre>

Above we can see that the file *wireshark_secret.txt* is created and contains the master secrets for our SSL sessions.

Lastly, let's stop capturing packets and configure *Wireshark* to use this file to decrypt our SSL traffic.

1. Click the *Edit->Preferences* menu
2. Expand the *Protocols* list in the left panel and select *SSL*
3. Configure the *(Pre)-Master-Secret log filename* 

![Screenshot](http://media.tumblr.com/631afb19f039641a53848aaeac9d755b/tumblr_inline_mtnd8y8O9n1rm0rs6.png)

Finally, we can see the decrypted SSL traffic:

![Screenshot](http://media.tumblr.com/2dbaf48cfb25ce79088d728ac2c08c39/tumblr_inline_mtndol8ecj1rm0rs6.png)

### Root Cause ###
It's difficult to see in the above screenshot, but the decrypted network trace shows our application sending several HTTP requests over a persistent connection. The last request that we send never receives a response. Instead, the Rackspace Cloudfiles server resets the TCP connection.

Per the HTTP 1.1 [RFC](http://www.ietf.org/rfc/rfc2616.txt)

*Servers SHOULD NOT close a connection in the middle of transmitting a response, unless a network or client failure is suspected.*

It's understandable that Cloudfiles may need to close connections as part of a resource allocation strategy, but resetting a connection in the middle of a request is not the answer.

It's worth noting, that even with the trace in hand, we decided not work this issue through official support channel at Rackspace. Instead, we worked open source contacts to get in touch with the Cloudfiles developers at Rackspace and sent them all of the info directly.

I wish I could end this post by saying that Rackspace has fixed the issue, but for now we've yet to see a resolution. But at least we did our part and put all of the information is in the right hands.  

[^1]: SSL is used colloquially throughout this article in place of TLS.
[^2]: The reason for the homegrown library is mostly due to Gevent, but there are other issues at play that which will not address.
[^3]: *Serially*, meaning send a request, wait for a response, send a request, wait for a response, etc... We want to make it clear that we are not *pipelining* requests.
[^4]: We're assuming TLS 1.X, which is most likely the case.
