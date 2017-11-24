module.exports = function(hljs) {
    var LISP_IDENT_RE = '[a-zA-Z_\\-\\+\\*\\/\\<\\=\\>\\&\\#][a-zA-Z0-9_\\-\\+\\*\\/\\<\\=\\>\\&\\#]*';
    var LISP_SIMPLE_NUMBER_RE = '(\\-|\\+)?\\d+(\\.\\d+|\\/\\d+)?((d|e|f|l|s)(\\+|\\-)?\\d+)?';
    var LITERAL = {
        className: 'literal',
        begin: '\\b(t{1}|nil)\\b'
    };
    var NUMBERS = [
        {
            className: 'number', begin: LISP_SIMPLE_NUMBER_RE
        },
        {
            className: 'number', begin: '#b[0-1]+(/[0-1]+)?'
        },
        {
            className: 'number', begin: '#o[0-7]+(/[0-7]+)?'
        },
        {
            className: 'number', begin: '#x[0-9a-f]+(/[0-9a-f]+)?'
        },
        {
            className: 'number', begin: '#c\\(' + LISP_SIMPLE_NUMBER_RE + ' +' + LISP_SIMPLE_NUMBER_RE, end: '\\)'
        }
    ];
    var STRING = {
        className: 'string',
        begin: '"', end: '"',
        contains: [hljs.BACKSLASH_ESCAPE],
        relevance: 0
    };
    var COMMENT = {
        className: 'comment',
        begin: ';', end: '$'
    };
    var VARIABLE = {
        className: 'variable',
        begin: '\\*', end: '\\*'
    };
    var KEYWORD = {
        className: 'keyword',
        begin: '[:&]' + LISP_IDENT_RE
    };
    var QUOTED_LIST = {
        begin: '(\\(|\\[|\\{)', end: '(\\)|\\]|\\})',
        contains: ['self', LITERAL, STRING].concat(NUMBERS)
    };
    var QUOTED1 = {
        className: 'quoted',
        begin: '[\'`](\\(|\\[|\\{)', end: '(\\)|\\]|\\})',
        contains: [STRING, VARIABLE, KEYWORD, QUOTED_LIST].concat(NUMBERS)
    };
    var QUOTED2 = {
        className: 'quoted',
        begin: '\\(quote ', end: '\\)',
        keywords: {title: 'quote'},
        contains: [STRING, VARIABLE, KEYWORD, QUOTED_LIST].concat(NUMBERS)
    };
    var LIST = {
        className: 'list',
        begin: '\\(', end: '\\)'
    };
    var VECTOR = {
        className: 'list',
        begin: '\\[', end: '\\]'
    };
    var DICT = {
        className: 'list',
        begin: '\\{', end: '\\}'
    };

    // var BODY = {
    //   className: 'body',
    //   endsWithParent: true, excludeEnd: true
    // };

    var keywords = ['if', 'define', 'define-macro', 'lambda', 'case', 'cond',
                    'or', 'and', 'begin'];

    var all = [{begin: keywords.join('|'), keywords: keywords.join(' ')},
               {begin: LISP_IDENT_RE},
               QUOTED1, QUOTED2, LIST, VECTOR, DICT, LITERAL,
               STRING, COMMENT, VARIABLE, KEYWORD]
        .concat(NUMBERS);
    LIST.contains = all;
    VECTOR.contains = all;
    DICT.contains = all;

    return {
        illegal: '[^\\s]',
        contains: [
            LITERAL,
            STRING,
            COMMENT,
            QUOTED1, QUOTED2,
            LIST,
            VECTOR,
            DICT
        ].concat(NUMBERS)
    };
};
