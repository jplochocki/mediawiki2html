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


/**
 * Makes a comparative test with MediaWiki results
 */
async function compareTest(testFilePrefix, testCallback) {
    document.write('<script type="module" src="/base/node_modules/diff/lib/index.es6.js"></script>');
    const JsDiff = await import('/base/node_modules/diff/lib/index.es6.js');

    // source dest fixtures - resource preparation
    let source = await getFixture(`${ testFilePrefix }-cmp-tests-source.txt`);
    let dest = await getFixture(`${ testFilePrefix }-cmp-tests-result.txt`);

    source = source.split(/\n?(-=-=-=-\[.*\]-=-=-=-)\n/);
    let tests = [], lastTestName = '';
    source.forEach(it => {
        it = it.trim();
        if(it == '')
            return;

        let m = /^-=-=-=-\[(.*)\]-=-=-=-$/.exec(it);
        if(m)
            lastTestName = m[1].trim();
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
        if(it == '')
            return;

        let m = /^-=-=-=-\[(.*)\]-=-=-=-$/.exec(it);
        if(m)
            lastTestName = m[1].trim();
        else {
            let a = tests.find(t => t.name == lastTestName);
            a.mediaWikiResult = it;
            a.mediaWikiResult_parts = splitHtmlParts(it);
        }
    });

    // call test & compare
    tests.forEach(test => {
        let result = testCallback(test.from);
        let result_parts = splitHtmlParts(result);

        let r = JsDiff.diffJson(test.mediaWikiResult_parts, result_parts);
        if(r.length > 1) {
            let out = `${ colors.red }test diff: ${ test.name }${ colors.reset } (${ test.from })\n\n`

            r.forEach(a => {
                if(a.added)
                    out += colors.green + '+' + a.value + colors.reset + '\n';
                else if(a.removed)
                    out += colors.red + '-' + a.value + colors.reset + '\n';
                else
                    out += ' ', a.value + '\n';
            });
            console.log(out);

            console.log('MediaWiki:', test.mediaWikiResult);
            console.log('Our:', result);
        }
    })
}


const colors = {
    reset: '\033[0m',
    green: '\033[32m',
    red: '\033[31m',
    black: '\033[30m',
    blue: '\033[34m',
    cyan: '\033[36m',
    purple: '\033[35m',
    brown: '\033[33m'
};


/**
 * @class HtmlCompareMatchers
 *
 * Jasmine custom matcher to compare HTML codes
 *
 * @code
 *
 * beforeEach(function() {
 *      jasmine.addMatchers(HtmlCompareMatchers);
 * });
 *
 */
let HtmlCompareMatchers = {
    htmlToBeEqual(util, customEqualityTesters) {
        return {
            compare(actual, expected) {
                let actLst = actual.split(/(<\/?[^>]+>)/);
                let expLst = expected.split(/(<\/?[^>]+>)/);

                const maxLength = Math.max(actLst.length, expLst.length);
                let line = 0;

                for(let i = 0; i < maxLength; i++) {
                    let act = actLst[i] ? actLst[i].trim() : '';
                    let exp = expLst[i] ? expLst[i].trim() : '';

                    if(act.startsWith('<')) { // tag compare
                        let [, act_isEnd, act_name, act_attrs] = /^<(\/?)([a-z]+)(\s*.*)>$/i.exec(act);
                        let [, exp_isEnd, exp_name, exp_attrs] = /^<(\/?)([a-z]+)(\s*.*)>$/i.exec(exp);
                        act_name = act_name.toLowerCase();
                        exp_name = exp_name.toLowerCase();

                        if(act_name != exp_name)
                            return {
                                pass: false,
                                message: `Expected tag name "${ exp_name }" to be equal "${ act_name }" (on line ${ line }).`
                            };

                        if(act_isEnd != exp_isEnd)
                            return {
                                pass: false,
                                message: `Expected both tags "${ exp_name }" to be ${ exp_isEnd == '/'? 'end' : 'start' } tags (on line ${ line }).`
                            };

                        act_attrs = Sanitizer.decodeTagAttributes(act_attrs);
                        exp_attrs = Sanitizer.decodeTagAttributes(exp_attrs);

                        let result = null;
                        Object.entries(exp_attrs).some(([k, v]) => {
                            if(act_attrs[k] === undefined) {
                                result = {
                                    pass: false,
                                    message: `Expected param "${ k }" in tag '${ act }' (on line ${ line }).`
                                };
                                return true;
                            }

                            if(act_attrs[k] != v) {
                                result = {
                                    pass: false,
                                    message: `Expected param "${ k }" in tag "${ exp_name }" with value "${ v }" but got "${ act_attrs[k] }" (on line ${ line }).`
                                };
                                return true;
                            }

                            delete act_attrs[k];
                            return false;
                        });

                        if(result)
                            return result;

                        if(Object.keys(act_attrs).length > 0)
                            return {
                                pass: false,
                                message: `Unexpected params '${ Sanitizer.safeEncodeTagAttributes(act_attrs) }' in tag '${ act }' (on line ${ line }).`
                            };
                    }
                    else if(act != exp.trim()) // string compare
                        return {
                            pass: false,
                            message: `Expected text "${ exp }" to be equal "${ act }" (on line ${ line })`
                        };

                    let a = act.match(/\n/g);
                    line += a? a.length : 0;
                }

                return {
                    pass: true,
                    message: 'expected not equal html strings'
                };
            }
        };
    }
};
