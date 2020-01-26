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
                tagText: 'dolor sit {{LoremIpsumTemplate}} amet',
                noCloseTag: false
            },
            ', consectetur adipiscing elit'
        ]);
    });

    it('not registered tag should be ignored', function() {
        let result = this.preprocessor.preprocessToObj('Lorem ipsum <lorem loremAttr="Lorem ipsum value">dolor sit amet</lorem>, consectetur adipiscing elit');
        expect(result).toEqual(['Lorem ipsum <lorem loremAttr="Lorem ipsum value">dolor sit amet</lorem>, consectetur adipiscing elit']);
    });

    it('tag that may have no end', function() {
        let result = this.preprocessor.preprocessToObj('Lorem ipsum <noinclude>dolor sit amet, consectetur adipiscing elit');
        expect(result).toEqual([
            'Lorem ipsum ',
            {
                type: 'ext-tag',
                tagName: 'noinclude',
                attributes: {},
                tagText: 'dolor sit amet, consectetur adipiscing elit',
                noCloseTag: true
            }
        ]);

        result = this.preprocessor.preprocessToObj('Lorem ipsum <noinclude>dolor sit amet</noinclude>, consectetur adipiscing elit');
        expect(result).toEqual([
            'Lorem ipsum ',
            {
                type: 'ext-tag',
                tagName: 'noinclude',
                attributes: {},
                tagText: 'dolor sit amet',
                noCloseTag: false
            },
            ', consectetur adipiscing elit'
        ]);

        result = this.preprocessor.preprocessToObj('Lorem ipsum <noinclude>dolor sit amet<noinclude>, consectetur adipiscing elit');
        expect(result).toEqual([
            'Lorem ipsum ',
            {
                type: 'ext-tag',
                tagName: 'noinclude',
                attributes: {},
                tagText: 'dolor sit amet',
                noCloseTag: true
            }, {
                type: 'ext-tag',
                tagName: 'noinclude',
                attributes: {},
                tagText: ', consectetur adipiscing elit',
                noCloseTag: true
            }
        ]);

        result = this.preprocessor.preprocessToObj('Lorem ipsum <noinclude>dolor sit amet<includeonly>, consectetur adipiscing elit');
        expect(result).toEqual([
            'Lorem ipsum ',
            {
                type: 'ext-tag',
                tagName: 'noinclude',
                attributes: {},
                tagText: 'dolor sit amet',
                noCloseTag: true
            }, {
                type: 'ext-tag',
                tagName: 'includeonly',
                attributes: {},
                tagText: ', consectetur adipiscing elit',
                noCloseTag: true
            }
        ]);

        result = this.preprocessor.preprocessToObj('Lorem ipsum <noinclude>dolor sit amet<includeonly>, consectetur</includeonly> adipiscing elit');
        expect(result).toEqual([
            'Lorem ipsum ',
            {
                type: 'ext-tag',
                tagName: 'noinclude',
                attributes: {},
                tagText: 'dolor sit amet',
                noCloseTag: true
            }, {
                type: 'ext-tag',
                tagName: 'includeonly',
                attributes: {},
                tagText: ', consectetur',
                noCloseTag: false
            },
            ' adipiscing elit'
        ]);
    });

    it('tag that must have end', function() {
        let result = this.preprocessor.preprocessToObj('Lorem ipsum <pre>dolor sit amet consectetur adipiscing elit');
        expect(result).toEqual(['Lorem ipsum <pre>dolor sit amet consectetur adipiscing elit']);


        result = this.preprocessor.preprocessToObj('Lorem ipsum <pre>dolor sit amet <noinclude>consectetur adipiscing elit');
        expect(result).toEqual([
            'Lorem ipsum <pre>dolor sit amet ',
            {
                type: 'ext-tag',
                tagName: 'noinclude',
                attributes: {},
                tagText: 'consectetur adipiscing elit',
                noCloseTag: true
            }
        ]);

        result = this.preprocessor.preprocessToObj('Lorem ipsum <noinclude>dolor sit amet <lorem>consectetur adipiscing elit');
        expect(result).toEqual([
            'Lorem ipsum ',
            {
                type: 'ext-tag',
                tagName: 'noinclude',
                attributes: {},
                tagText: 'dolor sit amet <lorem>consectetur adipiscing elit',
                noCloseTag: true
            }
        ]);

        result = this.preprocessor.preprocessToObj('Lorem ipsum <noinclude>dolor sit amet <pre>consectetur adipiscing elit');
        expect(result).toEqual([
            'Lorem ipsum ',
            {
                type: 'ext-tag',
                tagName: 'noinclude',
                attributes: {},
                tagText: 'dolor sit amet ',
                noCloseTag: true
            },
            '<pre>consectetur adipiscing elit'
        ]);

        result = this.preprocessor.preprocessToObj('Lorem ipsum <noinclude>dolor sit amet <pre>consectetur adipiscing</pre> elit');
        expect(result).toEqual([
            'Lorem ipsum ',
            {
                type: 'ext-tag',
                tagName: 'noinclude',
                attributes: {},
                tagText: 'dolor sit amet ',
                noCloseTag: true
            }, {
                type: 'ext-tag',
                tagName: 'pre',
                attributes: {},
                tagText: 'consectetur adipiscing',
                noCloseTag: false
            },
            ' elit'
        ]);
    });
});
