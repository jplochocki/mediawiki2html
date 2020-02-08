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
            'Lorem ipsum ', {
                type: 'header',
                title: 'dolor sit amet',
                level: 2,
                index: 1
            }, ' consectetur ', {
                type: 'header',
                title: 'adipiscing',
                level: 1,
                index: 2
            }, ' elit'
        ]);

        result = this.preprocessor.preprocessToObj('Lorem ipsum \n======dolor sit amet======\n consectetur \r\n=====adipiscing=====\r\n elit');
        expect(result).toEqual([
            'Lorem ipsum ', {
                type: 'header',
                title: 'dolor sit amet',
                level: 6,
                index: 1
            }, ' consectetur ', {
                type: 'header',
                title: 'adipiscing',
                level: 5,
                index: 2
            }, ' elit']);

        // invalid header sytuations
        result = this.preprocessor.preprocessToObj('Lorem ipsum \n==dolor sit amet== consectetur \r\n==adipiscing==\r\n elit');
        expect(result).toEqual([
            'Lorem ipsum \n==dolor sit amet== consectetur ', {
                type: 'header',
                title: 'adipiscing',
                level: 2,
                index: 1},
            ' elit'
        ]);

        result = this.preprocessor.preprocessToObj('Lorem ipsum \n==dolor sit amet===\n consectetur \n==adipiscing==\n elit');
        expect(result).toEqual([
            'Lorem ipsum \n==dolor sit amet===\n consectetur ', {
                type: 'header',
                title: 'adipiscing',
                level: 2,
                index: 1},
            ' elit'
        ]);
    });
});
