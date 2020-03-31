/**
 * Tests for src/preprocessor.js.
 *
 *
 * MIT License
 *
 * Copyright (c) 2020 Jacek Płochocki <jplochocki@op.pl>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */


describe('Test Preprocessor.reduceTemplateForInclusion', function() {
    beforeEach(function() {
        this.parser = new MWParser();
        this.preprocessor = new Preprocessor(this.parser);
    });

    it('onlyinclude for inclusion tests', function() {
        let result = this.preprocessor.reduceTemplateForInclusion(`A
<onlyinclude>B</onlyinclude>
<includeonly>C</includeonly>
<noinclude>D</noinclude>
<onlyinclude>E</onlyinclude>
<includeonly>F</includeonly>
G`);
        expect(result).toEqual('BE');

        result = this.preprocessor.reduceTemplateForInclusion(`A
<onlyinclude>B
<includeonly>C</includeonly>
<noinclude>D</noinclude>
<onlyinclude>E
<includeonly>F</includeonly>
G`);
        expect(result).toEqual('B\nE\n');

        result = this.preprocessor.reduceTemplateForInclusion(`A
<onlyinclude>B
<onlyinclude>E
<includeonly>C</includeonly>
<noinclude>D</noinclude>
<includeonly>F</includeonly>
G`);
        expect(result).toEqual('B\nE\n');
    });

    it('includeonly and noinclude tests', function() {
        let result = this.preprocessor.reduceTemplateForInclusion(`A
<includeonly>B</includeonly>
<noinclude>C</noinclude>
<includeonly>D</includeonly>
E`);
        expect(result).toEqual(`A\nB\n\nD\nE`);
    });
});


describe('Test Preprocessor.reduceTemplateForView', function() {
    beforeEach(function() {
        this.parser = new MWParser();
        this.preprocessor = new Preprocessor(this.parser);
    });

    it('Basic tests', function() {
        let result = this.preprocessor.reduceTemplateForView(`A
<onlyinclude>B</onlyinclude>
<includeonly>C</includeonly>
<noinclude>D</noinclude>
<onlyinclude>E</onlyinclude>
<includeonly>F</includeonly>
G`);
        expect(result).toEqual('A\nB\n\nD\nE\n\nG');
    });
});


describe('Test Preprocessor.preprocessToObj', function() {
    beforeEach(function() {
        this.parser = new MWParser();
        this.preprocessor = new Preprocessor(this.parser);
    });

    it('test valid tag', function() {
        let result = this.preprocessor.preprocessToObj('Lorem ipsum <pre loremAttr="Lorem ipsum value">dolor sit {{LoremIpsumTemplate}} amet</pre>, consectetur adipiscing elit');
        expect(result).toEqual([
            'Lorem ipsum ',
            {
                type: 'ext-tag',
                tagName: 'pre',
                attributes: {
                    loremattr: 'Lorem ipsum value'
                },
                noCloseTag: false,
                tagText: 'dolor sit {{LoremIpsumTemplate}} amet',
            },
            ', consectetur adipiscing elit'
        ]);
    });

    it('not registered tag should be ignored', function() {
        let result = this.preprocessor.preprocessToObj('Lorem ipsum <lorem loremAttr="Lorem ipsum value">dolor sit amet</lorem>, consectetur adipiscing elit');
        expect(result).toEqual(['Lorem ipsum <lorem loremAttr="Lorem ipsum value">dolor sit amet</lorem>, consectetur adipiscing elit']);
    });


    it('tag that must have end', function() {
        let result = this.preprocessor.preprocessToObj('Lorem ipsum <pre>dolor sit amet consectetur adipiscing elit');
        expect(result).toEqual(['Lorem ipsum <pre>dolor sit amet consectetur adipiscing elit']);
    });

    it('tag with xml style ending', function() {
        let result = this.preprocessor.preprocessToObj('Lorem ipsum <pre lorem="ipsum" dolor=\'sit amet\' />dolor sit amet consectetur adipiscing elit');
        let expResult = [
            'Lorem ipsum ',
            {
                type: 'ext-tag',
                tagName: 'pre',
                attributes: {
                    lorem: 'ipsum',
                    dolor: 'sit amet'
                },
                noCloseTag: true,
                tagText: '',
            },
            'dolor sit amet consectetur adipiscing elit'
        ];
        expect(result).toEqual(expResult);
        result = this.preprocessor.preprocessToObj('Lorem ipsum <pre lorem="ipsum" dolor=\'sit amet\'/>dolor sit amet consectetur adipiscing elit');
        expect(result).toEqual(expResult);
    });

    it('headers (==header==)', function() {
        let result = this.preprocessor.preprocessToObj('Lorem ipsum \n==dolor sit amet==\n consectetur \r\n=adipiscing=\r\n elit');
        expect(result).toEqual([
            'Lorem ipsum \n', {
                type: 'header',
                headerType: 'equal-signs',
                title: 'dolor sit amet',
                level: 2,
                index: 1
            }, '\n consectetur \r\n', {
                type: 'header',
                headerType: 'equal-signs',
                title: 'adipiscing',
                level: 1,
                index: 2
            }, '\r\n elit'
        ]);

        result = this.preprocessor.preprocessToObj('Lorem ipsum \n======dolor sit amet======\n consectetur \r\n=====adipiscing=====\r\n elit');
        expect(result).toEqual([
            'Lorem ipsum \n', {
                type: 'header',
                headerType: 'equal-signs',
                title: 'dolor sit amet',
                level: 6,
                index: 1
            }, '\n consectetur \r\n', {
                type: 'header',
                headerType: 'equal-signs',
                title: 'adipiscing',
                level: 5,
                index: 2
            }, '\r\n elit'
        ]);
    });

    it('invalid header sytuations', function() {
        let result = this.preprocessor.preprocessToObj('Lorem ipsum \n==dolor sit amet== consectetur \r\n==adipiscing==\r\n elit');

        expect(result).toEqual([
            'Lorem ipsum \n==dolor sit amet== consectetur \r\n', {
                type: 'header',
                headerType: 'equal-signs',
                title: 'adipiscing',
                level: 2,
                index: 1
            }, '\r\n elit'
        ]);

        result = this.preprocessor.preprocessToObj('Lorem ipsum \n==dolor sit amet===\n consectetur \n==adipiscing==\n elit');
        expect(result).toEqual([
            'Lorem ipsum \n==dolor sit amet===\n consectetur \n', {
                type: 'header',
                headerType: 'equal-signs',
                title: 'adipiscing',
                level: 2,
                index: 1
            }, '\n elit'
        ]);
    });

    it('more then 6 equal signs', function() {
        let a = 'Lorem ipsum \n=======dolor sit amet=======\n consectetur \n========adipiscing========\n elit';
        let result = this.preprocessor.preprocessToObj(a);
        expect(result).toEqual([a]);
    });

    it('headers based on tags', function() {
        let result = this.preprocessor.preprocessToObj('Lorem\n==ipsum==\n dolor sit amet, <h3>consectetur</h3> adipiscing elit.');
        expect(result).toEqual([
            'Lorem\n', {
                type: 'header',
                headerType: 'equal-signs',
                title: 'ipsum',
                level: 2,
                index: 1
            }, '\n dolor sit amet, ', {
                type: 'header',
                headerType: 'header-tag',
                title: 'consectetur',
                level: 3,
                index: 2
            }, ' adipiscing elit.'
        ]);

        result = this.preprocessor.preprocessToObj('Lorem ipsum <h4/> dolor sit amet.');
        expect(result).toEqual([
            'Lorem ipsum ', {
                type: 'header',
                headerType: 'header-tag',
                title: '',
                level: 4,
                index: 1
            }, ' dolor sit amet.'
        ]);
    });

    it('headers bug #1 (line before/after)', function() {
        // BUG: if the header started at the beginning of string,
        // ended at the end of string, or the headers followed one after
        // other - they were not parsed

        let result = this.preprocessor.preprocessToObj(`===Lorem ipsum (l3 -> l1)===
=Lorem ipsum l1=
==Lorem ipsum l2 A==
====Lorem ipsum l4====
=====Lorem ipsum l3=====
==Lorem ipsum l2 B==
==Lorem ipsum l2 C==`);
        expect(result).toEqual([{
            type: 'header',
            headerType: 'equal-signs',
            title: 'Lorem ipsum (l3 -> l1)',
            level: 3,
            index: 1
        }, '\n', {
            type: 'header',
            headerType: 'equal-signs',
            title: 'Lorem ipsum l1',
            level: 1,
            index: 2
        }, '\n', {
            type: 'header',
            headerType: 'equal-signs',
            title: 'Lorem ipsum l2 A',
            level: 2,
            index: 3
        }, '\n', {
            type: 'header',
            headerType: 'equal-signs',
            title: 'Lorem ipsum l4',
            level: 4,
            index: 4
        }, '\n', {
            type: 'header',
            headerType: 'equal-signs',
            title: 'Lorem ipsum l3',
            level: 5,
            index: 5
        }, '\n', {
            type: 'header',
            headerType: 'equal-signs',
            title: 'Lorem ipsum l2 B',
            level: 2,
            index: 6
        }, '\n', {
            type: 'header',
            headerType: 'equal-signs',
            title: 'Lorem ipsum l2 C',
            level: 2,
            index: 7
        }]);
    });

    it('headers bug #2 (template at begin / end)', function() {
        let result = this.preprocessor.preprocessToObj('=={{LoremIpsum}} dolor sit amet==');
        expect(result).toEqual([{
            type: 'header',
            headerType: 'equal-signs',
            title: '{{LoremIpsum}} dolor sit amet',
            level: 2,
            index: 1
        }]);

        result = this.preprocessor.preprocessToObj('==Dolor sit amet {{LoremIpsum}}==');
        expect(result).toEqual([{
            type: 'header',
            headerType: 'equal-signs',
            title: 'Dolor sit amet {{LoremIpsum}}',
            level: 2,
            index: 1
        }]);
    });

    it('basic template without parameters', function() {
        let result = this.preprocessor.preprocessToObj('Lorem {{ipsum}} dolor sit amet.');
        expect(result).toEqual([
            'Lorem ', {
                type: 'template',
                name: 'Ipsum',
                params: {}
            }, ' dolor sit amet.'
        ]);

        result = this.preprocessor.preprocessToObj('{{Lorem}}{{ipsum}}{{dolor}}');
        expect(result).toEqual([
            {
                type: 'template',
                name: 'Lorem',
                params: {}
            }, {
                type: 'template',
                name: 'Ipsum',
                params: {}
            }, {
                type: 'template',
                name: 'Dolor',
                params: {}
            }
        ]);
    });

    it('template without end', function() {
        let result = this.preprocessor.preprocessToObj('Lorem {{ipsum dolor sit amet.');
        expect(result).toEqual(['Lorem {{ipsum dolor sit amet.']);

        result = this.preprocessor.preprocessToObj('{{Lorem}} {{ipsum dolor sit amet.');
        expect(result).toEqual([
            {
                type: 'template',
                name: 'Lorem',
                params: {}
            }, ' {{ipsum dolor sit amet.'
        ]);

        result = this.preprocessor.preprocessToObj('{{Lorem}} {{ipsum dolor sit {{amet}}.');
        expect(result).toEqual([
            {
                type: 'template',
                name: 'Lorem',
                params: {}
            }, ' {{ipsum dolor sit ', {
                type: 'template',
                name: 'Amet',
                params: {}
            }, '.'
        ]);
    });

    it('template name with template', function() {
        let result = this.preprocessor.preprocessToObj('Lorem {{ipsum {{dolor}}}} sit amet.');
        expect(result).toEqual([
            'Lorem ', {
                type: 'template',
                name: 'Ipsum {{dolor}}',
                params: {}
            }, ' sit amet.'
        ]);

        result = this.preprocessor.preprocessToObj('Lorem {{{{ipsum}}}} sit amet.');
        expect(result).toEqual([
            'Lorem ', {
                type: 'template',
                name: '{{ipsum}}',
                params: {}
            }, ' sit amet.'
        ]);

        result = this.preprocessor.preprocessToObj('Lorem {{{{{ipsum}}}}} sit amet.');
        expect(result).toEqual([
            'Lorem ', {
                type: 'template',
                name: '{{{ipsum}}}',
                params: {}
            }, ' sit amet.'
        ]);

        result = this.preprocessor.preprocessToObj('Lorem {{ipsum {{dolor}} sit amet.');
        expect(result).toEqual([
            'Lorem {{ipsum ', {
                type: 'template',
                name: 'Dolor',
                params: {}
            }, ' sit amet.'
        ]);

        result = this.preprocessor.preprocessToObj('Lorem {{ipsum dolor}}}} sit amet.');
        expect(result).toEqual([
            'Lorem ', {
                type: 'template',
                name: 'Ipsum dolor',
                params: {}
            }, '}} sit amet.'
        ]);
    });

    it('template with params', function() {
        let result = this.preprocessor.preprocessToObj('{{Lorem|ipsum}}');
        expect(result).toEqual([
            {
                type: 'template',
                name: 'Lorem',
                params: {1: 'ipsum'}
            }
        ]);

        result = this.preprocessor.preprocessToObj('{{Lorem|ipsum|dolor|}}');
        expect(result).toEqual([
            {
                type: 'template',
                name: 'Lorem',
                params: {
                    1: 'ipsum',
                    2: 'dolor',
                    3: ''
                }
            }
        ]);

        result = this.preprocessor.preprocessToObj('{{Lorem|ipsum=dolor|sit=amet}}');
        expect(result).toEqual([
            {
                type: 'template',
                name: 'Lorem',
                params: {
                    ipsum: 'dolor',
                    sit: 'amet'
                }
            }
        ]);

        result = this.preprocessor.preprocessToObj('{{Lorem|ipsum|dolor=sit||amet=dolor}}');
        expect(result).toEqual([
            {
                type: 'template',
                name: 'Lorem',
                params: {
                    1: 'ipsum',
                    2: '',
                    dolor: 'sit',
                    amet: 'dolor'
                }
            }
        ]);

        result = this.preprocessor.preprocessToObj('{{Lorem|=ipsum|dolor=||sit amet}}');
        expect(result).toEqual([
            {
                type: 'template',
                name: 'Lorem',
                params: {
                    1: '',
                    2: 'sit amet',
                    dolor: ''
                }
            }
        ]);
    });

    it('template arguments and nested templates', function() {
        let result = this.preprocessor.preprocessToObj('{{Lorem|{{dolor}}}}');
        expect(result).toEqual([
            {
                type: 'template',
                name: 'Lorem',
                params: {
                    1: '{{dolor}}'
                }
            }
        ]);

        result = this.preprocessor.preprocessToObj('{{Lorem|{{{dolor}}}|sit=amet|lorem}}');
        expect(result).toEqual([
            {
                type: 'template',
                name: 'Lorem',
                params: {
                    1: '{{{dolor}}}',
                    2: 'lorem',
                    sit: 'amet'
                }
            }
        ]);


        result = this.preprocessor.preprocessToObj('{{Lorem|{{dolor}}=sit amet|sit=amet|lorem}}');
        expect(result).toEqual([
            {
                type: 'template',
                name: 'Lorem',
                params: {
                    1: 'lorem',
                    '{{dolor}}': 'sit amet',
                    sit: 'amet'
                }
            }
        ]);

        result = this.preprocessor.preprocessToObj('{{Lorem|{{{dolor}}}=sit amet|sit=amet|lorem}}');
        expect(result).toEqual([
            {
                type: 'template',
                name: 'Lorem',
                params: {
                    1: 'lorem',
                    '{{{dolor}}}': 'sit amet',
                    sit: 'amet'
                }
            }
        ]);

        result = this.preprocessor.preprocessToObj('{{Lorem|lorem={{dolor}}|sit=amet|lorem}}');
        expect(result).toEqual([
            {
                type: 'template',
                name: 'Lorem',
                params: {
                    1: 'lorem',
                    'lorem': '{{dolor}}',
                    sit: 'amet'
                }
            }
        ]);

        result = this.preprocessor.preprocessToObj('{{Lorem|lorem={{{dolor}}}|sit=amet|lorem}}');
        expect(result).toEqual([
            {
                type: 'template',
                name: 'Lorem',
                params: {
                    1: 'lorem',
                    'lorem': '{{{dolor}}}',
                    sit: 'amet'
                }
            }
        ]);

        result = this.preprocessor.preprocessToObj('{{Lorem|{{lorem}}={{dolor}}|sit=amet|lorem}}');
        expect(result).toEqual([
            {
                type: 'template',
                name: 'Lorem',
                params: {
                    1: 'lorem',
                    '{{lorem}}': '{{dolor}}',
                    sit: 'amet'
                }
            }
        ]);

        result = this.preprocessor.preprocessToObj('{{Lorem|{{{lorem}}}={{{dolor}}}|sit=amet|lorem}}');
        expect(result).toEqual([
            {
                type: 'template',
                name: 'Lorem',
                params: {
                    1: 'lorem',
                    '{{{lorem}}}': '{{{dolor}}}',
                    sit: 'amet'
                }
            }
        ]);
    });
});


describe('template params', function() {
    beforeEach(function() {
        this.parser = new MWParser();
        this.preprocessor = this.parser.preprocessor;
    });

    it('basic numbered and named arguments + default values', function() {
        let result = this.preprocessor.preprocessToObj('Lorem {{{1}}} {{{2|lorem ipsum}}} sit amet.');
        expect(result).toEqual([
            'Lorem ', {
                type: 'template-argument',
                name: '1',
                defaultValue: ''
            }, ' ', {
                type: 'template-argument',
                name: '2',
                defaultValue: 'lorem ipsum'
            }, ' sit amet.'
        ]);

        result = this.preprocessor.preprocessToObj('Lorem {{{ipsum}}} {{{dolor|lorem ipsum}}} sit amet.');
        expect(result).toEqual([
            'Lorem ', {
                type: 'template-argument',
                name: 'ipsum',
                defaultValue: ''
            }, ' ', {
                type: 'template-argument',
                name: 'dolor',
                defaultValue: 'lorem ipsum'
            }, ' sit amet.'
        ]);
    });

    it('ignored part of default value', function() {
        let result = this.preprocessor.preprocessToObj('Lorem {{{1|lorem ipsum|ignored rest of value}}} sit amet.');
        expect(result).toEqual([
            'Lorem ', {
                type: 'template-argument',
                name: '1',
                defaultValue: 'lorem ipsum'
            }, ' sit amet.'
        ]);

        result = this.preprocessor.preprocessToObj('Lorem {{{ipsum|lorem ipsum|ignored rest of value}}} sit amet.');
        expect(result).toEqual([
            'Lorem ', {
                type: 'template-argument',
                name: 'ipsum',
                defaultValue: 'lorem ipsum'
            }, ' sit amet.'
        ]);
    });

    it('template / template param in template param name', function() {
        let result = this.preprocessor.preprocessToObj('Lorem ipsum {{{Lorem {{ipsum}}}}} dolor.');
        expect(result).toEqual([
            'Lorem ipsum ', {
                type: 'template-argument',
                name: 'Lorem {{ipsum}}',
                defaultValue: ''
            }, ' dolor.'
        ]);

        result = this.preprocessor.preprocessToObj('Lorem ipsum {{{Lorem {{{ipsum}}}}}} dolor.');
        expect(result).toEqual([
            'Lorem ipsum ', {
                type: 'template-argument',
                name: 'Lorem {{{ipsum}}}',
                defaultValue: ''
            }, ' dolor.'
        ]);

        result = this.preprocessor.preprocessToObj('Lorem ipsum {{{Lorem {{ipsum}}|dolor sit amet}}} dolor.');
        expect(result).toEqual([
            'Lorem ipsum ', {
                type: 'template-argument',
                name: 'Lorem {{ipsum}}',
                defaultValue: 'dolor sit amet'
            }, ' dolor.'
        ]);

        result = this.preprocessor.preprocessToObj('Lorem ipsum {{{Lorem {{{ipsum}}}|dolor sit amet}}} dolor.');
        expect(result).toEqual([
            'Lorem ipsum ', {
                type: 'template-argument',
                name: 'Lorem {{{ipsum}}}',
                defaultValue: 'dolor sit amet'
            }, ' dolor.'
        ]);

        result = this.preprocessor.preprocessToObj('Lorem ipsum {{{Lorem {{ipsum|dolor sit amet}}}}} dolor.');
        expect(result).toEqual([
            'Lorem ipsum ', {
                type: 'template-argument',
                name: 'Lorem {{ipsum|dolor sit amet}}',
                defaultValue: ''
            }, ' dolor.'
        ]);

        result = this.preprocessor.preprocessToObj('Lorem ipsum {{{Lorem {{{ipsum|dolor sit amet}}}}}} dolor.');
        expect(result).toEqual([
            'Lorem ipsum ', {
                type: 'template-argument',
                name: 'Lorem {{{ipsum|dolor sit amet}}}',
                defaultValue: ''
            }, ' dolor.'
        ]);

        result = this.preprocessor.preprocessToObj('Lorem ipsum {{{Lorem {{ipsum|dolor sit amet}}|dolor sit amet}}} dolor.');
        expect(result).toEqual([
            'Lorem ipsum ', {
                type: 'template-argument',
                name: 'Lorem {{ipsum|dolor sit amet}}',
                defaultValue: 'dolor sit amet'
            }, ' dolor.'
        ]);

        result = this.preprocessor.preprocessToObj('Lorem ipsum {{{Lorem {{{ipsum|dolor sit amet}}}|dolor sit amet}}} dolor.');
        expect(result).toEqual([
            'Lorem ipsum ', {
                type: 'template-argument',
                name: 'Lorem {{{ipsum|dolor sit amet}}}',
                defaultValue: 'dolor sit amet'
            }, ' dolor.'
        ]);

        result = this.preprocessor.preprocessToObj('Lorem ipsum {{{Lorem {{ipsum|dolor sit amet}}|dolor sit amet|ignored default value}}} dolor.');
        expect(result).toEqual([
            'Lorem ipsum ', {
                type: 'template-argument',
                name: 'Lorem {{ipsum|dolor sit amet}}',
                defaultValue: 'dolor sit amet'
            }, ' dolor.'
        ]);

        result = this.preprocessor.preprocessToObj('Lorem ipsum {{{Lorem {{{ipsum|dolor sit amet}}}|dolor sit amet|ignored default value}}} dolor.');
        expect(result).toEqual([
            'Lorem ipsum ', {
                type: 'template-argument',
                name: 'Lorem {{{ipsum|dolor sit amet}}}',
                defaultValue: 'dolor sit amet'
            }, ' dolor.'
        ]);
    });

    it('template / template param in default value', function() {
        let result = this.preprocessor.preprocessToObj('Lorem {{{ipsum|{{lorem ipsum}}}}} {{{1|{{lorem ipsum}}}}} sit amet.');
        expect(result).toEqual([
            'Lorem ', {
                type: 'template-argument',
                name: 'ipsum',
                defaultValue: '{{lorem ipsum}}'
            }, ' ', {
                type: 'template-argument',
                name: '1',
                defaultValue: '{{lorem ipsum}}'
            }, ' sit amet.'
        ]);

        result = this.preprocessor.preprocessToObj('Lorem {{{ipsum|{{{lorem ipsum}}}}}} {{{1|{{{lorem ipsum}}}}}} sit amet.');
        expect(result).toEqual([
            'Lorem ', {
                type: 'template-argument',
                name: 'ipsum',
                defaultValue: '{{{lorem ipsum}}}'
            }, ' ', {
                type: 'template-argument',
                name: '1',
                defaultValue: '{{{lorem ipsum}}}'
            }, ' sit amet.'
        ]);

        result = this.preprocessor.preprocessToObj('Lorem {{{ipsum|{{{lorem ipsum|default value}}}}}} {{{1|{{{lorem ipsum|default value}}}}}} sit amet.');
        expect(result).toEqual([
            'Lorem ', {
                type: 'template-argument',
                name: 'ipsum',
                defaultValue: '{{{lorem ipsum|default value}}}'
            }, ' ', {
                type: 'template-argument',
                name: '1',
                defaultValue: '{{{lorem ipsum|default value}}}'
            }, ' sit amet.'
        ]);

        result = this.preprocessor.preprocessToObj('Lorem {{{ipsum|{{lorem ipsum}}|ignored rest of value}}} {{{1|{{lorem ipsum}}|ignored rest of value}}} sit amet.');
        expect(result).toEqual([
            'Lorem ', {
                type: 'template-argument',
                name: 'ipsum',
                defaultValue: '{{lorem ipsum}}'
            }, ' ', {
                type: 'template-argument',
                name: '1',
                defaultValue: '{{lorem ipsum}}'
            }, ' sit amet.'
        ]);
    });

    it('invalud template param formats', function() {
        let result = this.preprocessor.preprocessToObj('Lorem {{{ipsum {{{1|default value}}} sit amet.');
        expect(result).toEqual([
            'Lorem {{{ipsum ', {
                type: 'template-argument',
                name: '1',
                defaultValue: 'default value'
            }, ' sit amet.'
        ]);

        result = this.preprocessor.preprocessToObj('Lorem {{{1|default value sit amet.');
        expect(result).toEqual(['Lorem {{{1|default value sit amet.']);

        result = this.preprocessor.preprocessToObj('Lorem {{{1 sit amet.');
        expect(result).toEqual(['Lorem {{{1 sit amet.']);
    });
});
