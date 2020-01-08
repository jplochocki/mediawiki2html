/**
 * Test util functions.
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


/**
 * Get fixture file from Karma
 */
async function getFixture(file) {
    const r = await axios.get('/base/test/' + file);
    return r.data;
}


/**
 * Parse HTML text to parts, ie. from text:
 *
 * ```html
 * 'Lorem ipsum <a href="http://lorem.com" class="image">dolor sit <img alt="LoremIpsum.png" src="/images/a/af/LoremIpsum.png" width="313" height="490" /></a>
 * ```
 *
 * you should get:
 *
 * ```javascript
 * [
 *     {
 *         "type": "text",
 *         "text": "Lorem ipsum"
 *     },
 *     {
 *         "type": "tag",
 *         "tagName": "a",
 *         "attributes": {
 *             "href": "http://lorem.com",
 *             "class": "image"
 *         },
 *         "isEndTag": false
 *     },
 *     {
 *         "type": "text",
 *         "text": "dolor sit"
 *     },
 *     {
 *         "type": "tag",
 *         "tagName": "img",
 *         "attributes": {
 *             "alt": "LoremIpsum.png",
 *             "src": "/images/a/af/LoremIpsum.png",
 *             "width": "313",
 *             "height": "490"
 *         },
 *         "isEndTag": false
 *     },
 *     {
 *         "type": "tag",
 *         "tagName": "a",
 *         "attributes": {},
 *         "isEndTag": true
 *     }
 * ]
 * ```
 *
 * @param String txt
 * @return Array
 */
function splitHtmlParts(txt) {
    let bits = [];
    txt.split(/(<)/g).forEach(a => {
        if(bits.length > 0 && bits[bits.length -1] == '<')
            bits[bits.length -1] += a
        else if(a)
            bits.push(a);
    });

    let result = [];
    bits.forEach(bit => {
        bit = bit.trim()
        if(bit.indexOf('<') == -1 && bit) { // text only in bit
            result.push({
                type: 'text',
                text: bit
            });
            return;
        }

        // tag in bit
        let m = /^<(\/?)([A-Za-z][^\s/>]*?)\s+([^>]*?)(\/?>)([^<]*)$/gi.exec(bit.replace(/(\/)?>/g, ' $1>'));
        let [, isEndTag, tagName, attributes, , rest] = m;

        attributes = Sanitizer.decodeTagAttributes(attributes);
        isEndTag = isEndTag != '';

        result.push({
            type: 'tag',
            tagName,
            attributes,
            isEndTag,
            originalText: bit
        });

        // text pos after tag
        if(rest.trim())
            result.push({
                type: 'text',
                text: rest.trim()
            });
    });

    return result;
}


function compareHtmlParts(fromParts, toParts, stopImmediately=true) {
    fromParts.forEach((from, idx) => {
        let to = toParts[idx];
        if(form.type != to.type) {
            return;
        }
        if(from.type == 'text' && from.text != to.text) {
            return;
        }
        if(from.type == 'tag' ) {
        }
    });
    //originalText
}


/**
 * Makes a comparative test with MediaWiki results
 */
async function compareTest(testFilePrefix, testCallback, acceptablDifferences=[]) {
    document.write('<script type="module" src="/base/node_modules/diff/lib/index.es6.js"></script>');
    const JsDiff = await import('/base/node_modules/diff/lib/index.es6.js');

    // source dest fixtures - resource preparation
    let source = await getFixture(`${ testFilePrefix }-cmp-tests-source.txt`);
    let dest = await getFixture(`${ testFilePrefix }-cmp-tests-result.txt`);

    source = source.split(/\n?(-=-=-=-\[.*\]-=-=-=-)\n/);
    let tests = [], lastTestName = '';
    source.forEach(it => {
        it = it.trim();
        let m = /^-=-=-=-\[(.*)\]-=-=-=-$/.exec(it);
        if(m)
            lastTestName = m[1];
        else {
            tests.push({
                name: lastTestName,
                from: it,
                mediaWikiResult: '',
                mediaWikiResult_parts: []
            });
        }
    });

    dest = dest.split(/\n?(-=-=-=-\[.*\]-=-=-=-)\n/);
    dest.forEach(it => {
        it = it.trim();
        let m = /^-=-=-=-\[(.*)\]-=-=-=-$/.exec(it);
        if(m)
            lastTestName = m[1];
        else {
            let a = tests.find(t => t.name == lastTestName);
            a.mediaWikiResult = it;
            a.mediaWikiResult_parts = splitHtmlParts(it);
        }
    });

    // call test & compare
    //console.log('xxx', Diff);

    tests.forEach(test => {
        let result = testCallback(test.from);
        let result_parts = splitHtmlParts(result);

        let r = JsDiff.diffJson(test.mediaWikiResult_parts, result_parts);

        // TODO
    })
}
