/**
 * Tests generator for comparing MediaWiki results with our results.
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


const axios = require('axios');
const fs = require('fs');


const TEST_DIR = './test/'
const MW_API_URL = 'http://127.0.0.1:8080/api.php'


async function parseWikiText(txt) {
    let data = new URLSearchParams({
        action : 'parse',
        text : txt,
        contentmodel : 'wikitext',
        disablepp : true,
        preview : true,
        disabletoc : true,
        pst : true,
        format: 'json'
    });

    try {
        let resp = await axios.post(MW_API_URL, data);
        return resp.data.parse.text['*']
            .replace(/^<div class="mw-parser-output">/, '')
            .replace(/<\/div>$/, '')
            .replace(/^<p>/i, '')
            .replace(/<\/p>$/i, '')
            .trim();
    } catch(e) {
        console.log(e);
        return false;
    }
}


async function parseCmpTestsSources() {
    fs.readdirSync(TEST_DIR).forEach(async function(fl) {
        if(!/cmp-tests-source.txt$/.test(fl))
            return;

        console.log('Reading file', fl, '...');
        let src = fs.readFileSync(TEST_DIR + fl, {encoding: 'utf-8'});

        let lastTestMarker = '';
        let resultFile = await Promise.all(src.split(/\n?(-=-=-=-\[?.*\]?-=-=-=-)\n/).map(async function(test) {
            test = test.trim();
            if(!test)
                return;

            if(/^-=-=-=-/.test(test)) {
                lastTestMarker = test;
                return;
            }

            let ltm = lastTestMarker;
            let txt = await parseWikiText(test);
            return `${ ltm }\n\n${ txt }\n\n`;
        }));
        resultFile = resultFile.join('')

        let destFile = /^(.*)-cmp-tests-source.txt$/.exec(fl);
        destFile = `${ TEST_DIR }${ destFile[1] }-cmp-tests-result.txt`;
        console.log('Writing file', destFile, '...');
        fs.writeFileSync(destFile, resultFile);
    });
}

parseCmpTestsSources();
