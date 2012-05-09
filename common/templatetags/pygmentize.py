import logging
import re

from django import template
from django.template.defaultfilters import stringfilter
from django.utils.encoding import smart_unicode
from django.utils.safestring import mark_safe

from pygments import highlight
from pygments.lexers import get_lexer_by_name, get_lexer_for_filename
from pygments.formatters import HtmlFormatter
from pygments.util import ClassNotFound

class PygmentizeFormatter(HtmlFormatter):
    """Formatter for line numbered source code (ordered list)."""
    def wrap(self, source, outfile):
        return self._wrap_div(self._wrap_pre(self._wrap_ordered_list(source)))

    def _wrap_ordered_list(self, source):
        yield 0, '<ol>'
        for i, t in source:
            if i == 1:
                t = '<li>%s</li>' % t
            yield i, t
        yield 0, '</ol>'

def pygmentize_html(text, **kwargs):
    #default no-op lexer
    default_lexer = 'text'

    text = smart_unicode(text)

    #Formatter for line numbered code
    formatter = PygmentizeFormatter(encoding='UTF-8', **kwargs)

    #Regular expression for html pre tags with optional data-language and data-filename attributes
    pre_regex = re.compile(r'(<pre[^>]*>)(.*?)(</pre>)', re.DOTALL | re.UNICODE)
    language_regex = re.compile(r'data-language="(.+)"', re.DOTALL | re.UNICODE)
    filename_regex = re.compile(r'data-filename="(.+)"', re.DOTALL | re.UNICODE)

    def replace(pre_match):
        """Helper method to convert pre code to highlighted code.

        Args:
            pre_match: A regular expression Match object for the pre tag containing
            the code to be highlighted. The Match object must contain 3 capture
            groups (<pre.*>, body, </pre>)
        """
        #Find the lexer by language (data-language) attribute if provided,
        #otherwise fall back to filename (data-filename) attribute.
        #As a last restor, use the default_lexer (text) which does
        #contain any syntax highlighting.
        try:
            lexer = None
            language_match = language_regex.search(pre_match.group(1))
            if language_match:
                language = language_match.group(1).strip()
                lexer = get_lexer_by_name(language)
            else:
                filename_match = filename_regex.search(pre_match.group(1))
                if filename_match:
                    filename = filename_match.group(1).strip()
                    lexer = get_lexer_for_filename(filename)
        except ClassNotFound:
            lexer = get_lexer_by_name(default_lexer)
        finally:
            if lexer is None:
                lexer = get_lexer_by_name(default_lexer)
        
        #Extract the body of the pre tag which contains code
        #to highlight
        code = pre_match.group(2)

        #Highlight the code
        code = highlight(code, lexer, formatter)

        return smart_unicode(code)
    
    #Substitute pre tags containing code, with highighted code.
    result, num_substitutions = re.subn(pre_regex, replace, text)
    return result

register = template.Library()

@register.filter
@stringfilter
def pygmentize(value):
    """Django filter for rendered highlighted code with line numbers.
    
    This filter requires pygmentize.css.

    Example usage:
        {% filter pygmentize %}
        <pre data-filename="test.py">{{doc|safe}}</pre>
        {% endfilter %}

        {% filter pygmentize %}
        <pre data-language="python">{{doc|safe}}</pre>
        {% endfilter %}
    """
    try:
        code = pygmentize_html(value)
    except Exception as error:
        logging.exception(error)
        code = value
    return mark_safe(code)
