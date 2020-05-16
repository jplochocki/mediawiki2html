/**
 * src/languages.js generator from MediaWiki languages code.
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


const fs = require('fs');
const path = require('path');

const MEDIAWIKI_SOURCE  = process.argv.slice(2).join('');
if(!fs.existsSync(MEDIAWIKI_SOURCE)) {
    console.log('Error: MediaWiki source dir expected in call arguments.');
    process.exit(1);
}

console.log('Working from source', MEDIAWIKI_SOURCE, '...');


let languages = fs.readdirSync(path.join(MEDIAWIKI_SOURCE, 'languages/messages')).map(file => {
    const language = /Messages(.+).php/.exec(file)[1].toLowerCase();
    const lines = fs.readFileSync(path.join(MEDIAWIKI_SOURCE, 'languages/messages', file), {encoding: 'utf8', flag: 'r'}).split(/\r?\n/);
    return {language, lines, fallback: []};
});


function phpAssociativeArrayItemRe(name, valueIsArray=false) {
    if(valueIsArray)
        return new RegExp(`^\\s*'(${ name })'\\s*=>\\s*\\[(.*?)\\]\\s*,\\s*$`, 'i');
    return new RegExp(`^\\s*'(${ name })'\\s*=>\\s*(.*?)\\s*,\\s*$`, 'i');
}


const EXTRACT_FROM_MESSAGES = [
    { // find language description
        find: [
            /^\s*\/\*\*\s*(.+?\s*\([^\)]+?\))/i,  // i.e. /** Chinese (Macau)
            /^\s*\/\*\*\s*(.+?)/i            // i.e. /** Laki
        ],
        saveAs: 'languageDescription'
    },
    { // language fallback
        find: [
            /\s*\$fallback\s*=\s*'([^\']+?)'/i // i.e. $fallback = 'zh-hk, zh-hant, zh-hans';
        ],
        saveAs: (language, txt) => {
            language.fallback = txt.split(/,\s*/);
        }
    },
    { // interesting specjal pages
        from: /\$specialPageAliases\s*=\s*\[/i,
        to: /\s*\]\s*;\s*/i,

        find: [
            phpAssociativeArrayItemRe('Upload', true)
        ],

        saveAs: (language, name, value) => {
            if(!language.specialPageAliases)
                language.specialPageAliases = {}

            if(!language.specialPageAliases[name])
                language.specialPageAliases[name] = [];
            value = value.split(/(?:'|")(.*?)(?:'|"),?\s*/).filter(Boolean).filter(a => !/^\s+$/.test(a));
            language.specialPageAliases[name].push.apply(language.specialPageAliases[name], value)
        }
    }
];


EXTRACT_FROM_MESSAGES.forEach(fnd => {
    languages.forEach(lang => {
        let inFromToRange = false;
        lang.lines.some(ln => {
            if(fnd.from && !inFromToRange) {
                inFromToRange = fnd.from.test(ln);
                return false;
            }

            if(fnd.to && inFromToRange && fnd.to.test(ln)) {
                inFromToRange = false;
                return false;
            }

            return fnd.find.some(find => {
                let a = find.exec(ln);
                if(a) {
                    if(typeof fnd.saveAs == 'function')
                        fnd.saveAs(lang, a[1], a[2], a[3], a[4]);
                    else
                        lang[fnd.saveAs] = a[1];
                    return true;
                }
            });
        });

    });
});


// languageDescription for en + en_rtl
['en', 'en_rtl'].forEach(a => {
    languages.find(b => b.language == a).languageDescription = 'English';
});


// fallback resolution
const en_base = languages.find(b => b.language == 'en'); // english is base for all
let maxRetry = 5;
while(true) {
    maxRetry--;
    let notResolvedAll = false;
    languages.forEach((lng, idx) => {
        if(lng.fallback.length == 0 || maxRetry == 0) {
            languages[idx] = {
                ...en_base,
                ...lng
            };
        }
        else {
            let fallback0 = languages.find(b => b.language == lng.fallback[0]);
            if(!fallback0) {
                lng.fallback.unshift();
                return;
            }

            if(fallback0.fallback.length > 0) { // fallback has own fallback not resolved jet
                notResolvedAll = true;
                return;
            }

            languages[idx] = {
                ...fallback0,
                ...lng
            };
            lng.fallback.unshift();

            if(lng.fallback.length > 0)
                notResolvedAll = true;
        }
    });

    if(!notResolvedAll || maxRetry <= 0)
        break;
}


// write result out
let outLangs = {};

languages.forEach(lng => {
    let {language, languageDescription = '', specialPageAliases = []} = lng;
    outLangs[language] = {
        languageDescription,
        specialPageAliases
    };
});

fs.writeFileSync(path.resolve(__dirname, 'src/languages.js'), 'export default ' + JSON.stringify(outLangs, null, 4) + ';', {encoding: 'utf8'});

