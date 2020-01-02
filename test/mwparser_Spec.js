/**
 * Tests for src/mwparser.js.
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


describe('Testy handleTables()', function() {
    beforeEach(function() {
    });

    it('...', function() {
        const testTable = `
{|class="wikitable" style="width: 100%;"
|aaa
|bbb
|ccc
|-
|aaa2
|bbb2
|ccc2
|}
        `
        const par = new MWParser();
        const out = par.handleTables(testTable);

    });

    afterEach(function() {
    });
});


describe('Test MWParser.handleInternalLinks()', function() {
    it('basic tests', function() {
        const testText = `Lorem [[ns:ipsum]] dolor [[sit|lorem]]amet, consectetur [[adipiscing elit`;
        const par = new MWParser();
        let result = par.handleInternalLinks(testText);
        //console.log('result', result);
    });
});


describe('Test Parser.makeLinkObj', function() {
    it('basic tests', function() {
        const par = new MWParser();
        let t = Title.newFromText('lorem:ipsum');
        expect(par.makeLinkObj(t)).toEqual('<a title="Lorem:ipsum" href="//en.wikipedia.org/w/index.php?title=Lorem%3Aipsum">Lorem:ipsum</a>');


        let r = par.makeLinkObj(t, 'link title', {foo: 'bar'}, 'trail rest of text', 'prefix')
        expect(r).toEqual(
            '<a title="Lorem:ipsum" href="//en.wikipedia.org/w/index.php?foo=bar&title=Lorem%3Aipsum">prefixlink titletrail</a> rest of text');
        //console.log(r);
    });
});
