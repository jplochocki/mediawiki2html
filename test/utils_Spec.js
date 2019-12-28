/**
 * Tests fot utils.js.
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


describe('Test StringUtils.replaceMarkup()', function() {
    it('basic tests', function() {
        let result = StringUtils.replaceMarkup('lorem', 'dolor',
            'lorem ipsum <div>dolor <lorem>sit</lorem>lorem amet</div>, consectetur <lorem>adipiscing elit lorem');
        expect(result).toEqual(
            'dolor ipsum <div>dolor <lorem>sit</lorem>dolor amet</div>, consectetur <lorem>adipiscing elit dolor');
    });
});


describe('Tests StringUtils.delimiterReplaceCallback()', function() {
    beforeEach(function() {
        this.inputWithTags = 'Lorem ipsum <div>dolor sit amet</div>, consectetur <>adipiscing elit';
        this.inputWithLongDelimiter = 'Lorem ipsum ---div==dolor sit amet---/div==, consectetur ---==adipiscing elit';
    });

    it('result is the same without replace', function() {
        let result = StringUtils.delimiterReplaceCallback('<', '>', (a) => {
            return a[0];
        }, this.inputWithTags, flags='i');
        expect(result).toEqual(this.inputWithTags);
    });

    it('result is the same without replace / long delimiters', function() {
        let result = StringUtils.delimiterReplaceCallback('---', '==', (a) => {
            return a[0];
        }, this.inputWithLongDelimiter, flags='i');
        expect(result).toEqual(this.inputWithLongDelimiter);
    });

    it('replace change string', function() {
        let result = StringUtils.delimiterReplaceCallback('<', '>', (a) => {
            return '<Lorem ipsum>';
        }, this.inputWithTags, flags='i');
        expect(result).toEqual('Lorem ipsum <Lorem ipsum>dolor sit amet<Lorem ipsum>, consectetur <Lorem ipsum>adipiscing elit');
    });

    it('replace change string / long delimiter', function() {
        let result = StringUtils.delimiterReplaceCallback('---', '==', (a) => {
            return '<Lorem ipsum>';
        }, this.inputWithLongDelimiter, flags='i');
        expect(result).toEqual('Lorem ipsum <Lorem ipsum>dolor sit amet<Lorem ipsum>, consectetur <Lorem ipsum>adipiscing elit');
    });
});
