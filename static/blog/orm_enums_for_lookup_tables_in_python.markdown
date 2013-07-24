*[DRY]: Don't Repeat Yourself
*[O/R]: Object Relational
*[ORM]: Object Relational Mapping
*[OTLT]: One True Lookup Table

RDBMS lookup tables and Object Relational (O/R) mapping both pop up frequently in modern web applications. And chances are pretty good that where you find lookup tables, you'll also find O/R mapping.

O/R mapping solutions don't usually differentiate between normal database tables and lookup tables. The classes generated for lookup tables are typically of the same form as those generated for other tables. The result is cumbersome lookup table classes that don't quite fit in the object oriented world.

Before we dig into our solution to this problem, let's start with a little background.

[[MORE]]

### Lookup Tables ###
Lookup tables typically come in two flavors, domain-specific and OTLT.

#### Domain-specific Lookup Tables ####
Domain-specific lookup tables describe a single domain and help to maintain proper database normalization and promote data integrity through well defined foreign keys.

<pre class="prettyprint">database=> select * from proc_status;
 id |       name       |      description                  
----+------------------+-----------------------
  1 | ALIVE            | Process is alive. 
  2 | STARTING         | Process is starting. 
  3 | STOPPING         | Process is stopping.
  4 | STOPPED          | Process is stopped.
  5 | DEAD             | Process is dead.
</pre>

Notice in the table above that our primary key is an integer. On occasion you may come across lookup tables which omits the *id* column and instead use the *name* column as the primary key.

While using a string column as the primary key can make interacting with lookup tables easier, it will result in increased database size. The increase in size can be substantial, especially if you have a large number of rows referencing your lookup tables.

Moving forward we&rsquo;ll operate under the assumption that our lookup tables contain integer primary keys.

#### One True Lookup Table's ####
One True Lookup Table's (OTLT) denormalize multiple domains into a single lookup table.

<pre class="prettyprint">database=> select * from lookup;
 id |  context   |   name     |     description                  
----+------------+------------+--------------------
  1 | STATUS     | Alive      | Process is alive. 
  2 | STATUS     | Starting   | Process is starting. 
  3 | STATUS     | Stopping   | Process is stopping. 
  4 | STATUS     | Stopped    | Process is stopped. 
  5 | STATUS     | Dead       | Process is dead.
  6 | COLOR      | Red        | Red
  7 | COLOR      | Blue       | Blue
  8 | COLOR      | Green      | Green
</pre>

Proponents of OTLT maintain that combining multiple lookup tables into a single table simplifies the overall database schema and its maintenance.

Unfortunately, the price of this simplification is paid for with data integrity. A single lookup table, means related tables will get stuck with vague foreign keys.

#### Domain-specific Lookup Tables vs. OTLT ####
We don&rsquo;t believe that the simplification gains from OTLT justify the data integrity loss. From this point on, any reference to a lookup table will refer to a domain-specific lookup table, not an OTLT.

### O/R Mapping and Lookup Tables ###

Leveraging O/R mapping classes for lookup tables is cumbersome. Consider the code for accessing the proc_status lookup table (described above) using both Django and SQLAlchemy:

<pre class="prettyprint">
#Django ORM

#create Proc model which contains a foreign key,
#status, to the ProcStatus model
status = ProcStatus.objects.get(name="ALIVE")

process = Proc(
    name='myapp', 
    pid=1234, 
    status=status)
process.save()

#read all procs
procs = Proc.objects.select_related("status").all()

#read all ALIVE and DEAD procs
statuses = ProcStatus.objects.\
    filter(name__in=["ALIVE", "DEAD"]).all()
procs = Proc.objects.select_related("status").\
   filter(status__in=statuses).all()
</pre>

Or

<pre class="prettyprint">#SQLAlchemy ORM
session = Session()

#create Proc model which contains a foreign key,
#status, to the ProcStatus model
status = session.query(ProcStatus).\
    filter_by(name="ALIVE").one()

process = Proc(
    name='myapp',
    pid=1234,
    status=status)
session.commit()

#read all procs
procs = session.query(Proc).\
    options(joinedload(Proc.status)).\
    all()
    
#read all ALIVE and DEAD procs
statuses = session.query(ProcStatus).\
    filter(ProcStatus.name.in_(["ALIVE", "DEAD"])\.
    all()   
procs = session.query(Proc).\
    options(joinedload(Proc.status)).\
    filter(Proc.status_id.in_([s.id for s in statuses])).\
    all()
</pre>

The first thing you may have noticed about this code is that both creating and reading the *Proc* object requires additional database work in order to determine the *ProcStatus* id's. While true, this isn't my biggest problem with the code.

My biggest issue with the above code is its awkwardness. The first OO abstraction that comes to mind when I think lookup table is *Enum*, not *Class*. In other words, I'd like the above code to look more like the following:

<pre class="prettyprint">
#SQLAlchemy ORM
session = Session()

#create
process = Proc(
    name='myapp',
    pid=1234,
    status_id=ProcStatus.ALIVE)
session.commit()

#read all procs
procs = session.query(Proc).all()
    
#read all ALIVE and DEAD procs
statuses = [ProcStatus.ALIVE, ProcStatus.DEAD]
procs = session.query(Proc).\
    filter(Proc.status_id.in_(statuses)).\
    all()
</pre>

### ORM Enums for Lookup Tables ###
ORM Enums for lookup tables look compelling, assuming they meet the following constraints:

1. Enum-like attribute access, i.e. *ProcStatus.ALIVE*
2. Enum values keep in sync with the lookup table - *no hard coding*
3. Database access is safely throttled
4. Enums should not require instantiation

Below is the full source code for our *Enum* class. Take a quick look to get a feel for the overall structure. Don't worry about fully understanding the code, we'll break it down in the next sections.

<pre class="prettyprint" style="max-height: 400px; overflow-y: auto;" >
class DBEnumMeta(type):
    def __new__(cls, name, bases, attributes):

        #create new class
        new_class = super(DBEnumMeta, cls).__new__(
            cls, name, bases, {})

        new_class.load_timestamp = 0
        new_class.KEYS_TO_VALUES = {}
        new_class.VALUES_TO_KEYS = {}
        
        if not attributes.get("base", False):
            required = [
                "model_class",
                "key_column",
                "value_column",
                "db_session_factory"
            ]
            
            for attribute in required:
                if attribute not in attributes:
                    msg = "'%s' att required" % attribute
                    raise RuntimeError(msg) 

        #Add class attributes to new class
        for name, value in attributes.items():
            new_class.add_to_class(name, value)
        
        try:
            if "base" not in attributes:
                new_class.load()
        except Exception as error:
            logging.exception(error)

        return new_class

    def __getattr__(cls, attribute):
        if cls.should_load(attribute):
            try:
                cls.load()
            except Exception as error:
                logging.exception(error)

        if attribute not in cls.KEYS_TO_VALUES:
            msg = "no such attribute '%s'" % attribute
            raise AttributeError(msg)

        return cls.KEYS_TO_VALUES[attribute]

    def add_to_class(cls, name, value):
        if hasattr(value, "contribute_to_class"):
            value.contribute_to_class(cls, name)
        else:
            setattr(cls, name, value)
    
    def should_load(cls, attribute):
        result = False
        elapsed = time.time() - cls.load_timestamp
        if attribute in cls.KEYS_TO_VALUES:
            result = elapsed &gt; cls.expire and \
                     elapsed &gt; cls.throttle
        else:
            result = elapsed &gt; cls.throttle

        return result

    def load(cls):
        try:
            cls.load_timestamp = time.time()

            session = None
            keys_to_values = {} 
            values_to_keys = {}

            session = cls.db_session_factory()
            models = session.query(cls.model_class).all()
            for model in models:
                key = getattr(model, cls.key_column)
                value = getattr(model, cls.value_column)
         
                keys_to_values[key] = value
                values_to_keys[value] = key
            
            cls.KEYS_TO_VALUES = keys_to_values
            cls.VALUES_TO_KEYS = values_to_keys

            session.commit()

        except Exception:
            if session:
                session.rollback()
            raise
        finally:
            if session:
                session.close()


class DBEnum(object):
    __metaclass__ = DBEnumMeta
    base = True
    expire = 3600
    throttle = 60
    def __init__(*args, **kwargs):
        raise RuntimeError("Enum should not be instantiated")
</pre>

#### Enum-like attribute access ####
Enum-like attribute access, i.e. *ProcStatus.ALIVE* , can be implemented by adding a *\_\_getattr\_\_* method. *\_\_getattr\_\_* is invoked whenever an attribute cannot be found in the usual places.

In the case of *ProcStatus.ALIVE*\, the *ALIVE* attribute will not be found in the usual places, so *\_\_getattr\_\_* will be invoked accordingly. Ignoring the load logic for now, the code below simply returns the database value for *ALIVE* from the *KEYS_TO_VALUES* dict, or, if it cannot be found, raises an *AttributeError* \.

<pre class="prettyprint">
....
    def __getattr__(cls, attribute):
        if cls.should_load(attribute):
            try:
                cls.load()
            except Exception as error:
                logging.exception(error)

        if attribute not in cls.KEYS_TO_VALUES:
            msg = "no such attribute '%s'" % attribute
            raise AttributeError(msg)

        return cls.KEYS_TO_VALUES[attribute]
...
</pre>

#### Keeping in sync ####
In order to keep our *Enum* values in sync with the lookup table we *load()* the values when the *class* object is first instantiated.

Additionally, if an *Enum* property is accessed, which cannot currently be found in the *KEYS_TO_VALUES* dict, we will reload the data from the lookup table (as long as it does not violate our *throttle* ).

And for good measure, *Enum* values can also be set to *expire*\ . If an *Enum* property is accessed and its values are expired, the lookup data will be reloaded.

Despite this last measure, it&rsquo;s important to note that *Enum* values should never be changed. This feature is intended to load new *Enum* values on a read operation, not to update existing *Enum* values that have changed.

The code below leverages SQLAlchemy, but it should be straightforward to modify it to work with Django or your ORM of choice.

<pre class="prettyprint" style="max-height: 400px; overflow-y: auto;" >
...
    def load(cls):    
        try:
            cls.load_timestamp = time.time()

            session = None
            keys_to_values = {} 
            values_to_keys = {}

            session = cls.db_session_factory()
            models = session.query(cls.model_class).all()
            for model in models:
                key = getattr(model, cls.key_column)
                value = getattr(model, cls.value_column)

                keys_to_values[key] = value
                values_to_keys[value] = key
            
            cls.KEYS_TO_VALUES = keys_to_values
            cls.VALUES_TO_KEYS = values_to_keys

            session.commit()

        except Exception:
            if session:
                session.rollback()
            raise
        finally:
            if session:
                session.close()
...
</pre>

#### Throttled database access ####
It's important that misbehaving code which repeatedly accesses missing *Enum* values does not result in excessive database requests.

To prevent excessive I/O our *Enum* class supports a *throttle* property. When set, the database will be accessed at most once every *throttle* seconds.

<pre class="prettyprint">
...
    def should_load(cls, attribute):
        result = False
        elapsed = time.time() - cls.load_timestamp
        if attribute in cls.KEYS_TO_VALUES:
            result = elapsed &gt; cls.expire and \
                     elapsed &gt; cls.throttle
        else:
            result = elapsed &gt; cls.throttle

        return result
...
</pre>

#### No instantiation ####
Our *Enum* class will not require instantiation. This will allow us to use it as follows:

<pre class="prettyprint">class ProcStatusEnum(DBEnum):
    model_class = ProcStatus
    key_column = "name"
    value_column = "id"
    db_session_factory = Session

    expire = 3600   #expire values every 300s
    throttle = 30   #max 1 db access every 30s

print ProcStatusEnum.ALIVE
# 1
print ProcStatusEnum.DEAD
# 5
print ProcStatusEnum.VALUES_TO_KEYS
# { "ALIVE": 1, "STARTING": 2, ... }
print ProcStatusEnum.KEYS_TO_VALUES
# { 1: "ALIVE", 2: "STARTING", ... }
</pre>

In order to achieve this behavior, we derive *ProcStatusEnum* from *DBEnum* which leverages meta class *DBEnumMeta* to properly initialize its values when the class object is first created.

<pre class="prettyprint" style="max-height: 400px; overflow-y: auto;" >
class DBEnumMeta(type):
    def __new__(cls, name, bases, attributes):

        #create new class
        new_class = super(DBEnumMeta, cls).__new__(
            cls, name, bases, {})

        new_class.load_timestamp = 0
        new_class.KEYS_TO_VALUES = {}
        new_class.VALUES_TO_KEYS = {}
        
        if not attributes.get("base", False):
            required = [
                "model_class",
                "key_column",
                "value_column",
                "db_session_factory"
            ]
            
            for attribute in required:
                if attribute not in attributes:
                    msg = "'%s' attr required" % attribute
                    raise RuntimeError(msg) 

        #Add class attributes to new class
        for name, value in attributes.items():
            new_class.add_to_class(name, value)
        
        try:
            if "base" not in attributes:
                #load data from lookup table
                new_class.load()
        except Exception as error:
            logging.exception(error)

        return new_class
    ...

class DBEnum(object):
    __metaclass__ = DBEnumMeta
    base = True
    expire = 3600
    throttle = 60
    def __init__(*args, **kwargs):
        raise RuntimeError("DBEnum should not be instantiated")
</pre>

#### Putting it all together ####
Let's now revisit our lookup table code from earlier. But this time let's leverage our *Enum* class.

<pre class="prettyprint">
#SQLAlchemy ORM
session = Session()

#Process status enum for our lookup table
class ProcStatusEnum(DBEnum):
    model_class = ProcStatus
    key_column = "name"
    value_column = "id"
    db_session_factory = Session

    expire = 3600   #expire values every 300s
    throttle = 30   #max 1 db access every 30s

#create Proc model which contains a foreign key,
#status, to the ProcStatus model
process = Proc(
    name='myapp',
    pid=1234,
    status_id=ProcStatusEnum.ALIVE)
session.commit()

#read all procs
procs = session.query(Proc).all()
    
#read all ALIVE and DEAD procs
statuses = [ProcStatusEnum.ALIVE, ProcStatusEnum.DEAD]
procs = session.query(Proc).\
    filter(Proc.status_id.in_(statuses)).\
    all()
</pre>

Overall, the code above is much cleaner and better suited for an object oriented environment.

*[Jeffrey Mullins](https://twitter.com/_jmullins_) is a co-founder at Tech Residents\.*    
*Tech Residents is paving the DRY road to developer dream jobs\.*    
*And on this road, developers are always in the driver's seat\.* 
*See for yourself at [techresidents.com](http://techresidents.com)\.*
