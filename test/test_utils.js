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


const isNodeEnv = typeof module === 'object' && module.exports;


import { Sanitizer } from '../src/sanitizer.js';


/**
 * Get fixture file from Karma
 */
export async function getFixture(file) {
    if(isNodeEnv) {
        const fs = require('fs');
        const path = require('path');

        return new Promise((resolve, reject) => {
            fs.readFile(path.resolve(__dirname, file), 'utf8', function (err, data) {
                if (err) {
                    reject(err);
                }
                resolve(data);
            });
        });
    }

    const r = await axios.get('/base/test/' + file);
    return r.data;
}


/**
 * Makes a comparative test with MediaWiki results
 */
export async function compareTest(testFilePrefix, testCallback) {
    jasmine.addMatchers(HtmlCompareMatchers);

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
                sourceWikiTxt: it,
                mediaWikiResult: '',
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
        }
    });

    // call test & compare
    tests.forEach(test => {
        let ourResult = testCallback(test.sourceWikiTxt);
        expect(ourResult).withContext(`compareTest for ${ testFilePrefix } in case ${ test.name }`).htmlToBeEqual(test.mediaWikiResult);
     });
}


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
export let HtmlCompareMatchers = {
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
