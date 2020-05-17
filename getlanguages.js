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


let BEGINNING_COMMENT = fs.readFileSync(__filename, {encoding: 'utf8', flag: 'r'}).split(/\r?\n/);
BEGINNING_COMMENT = BEGINNING_COMMENT.slice(0, BEGINNING_COMMENT.findIndex(ln => /^\s*\*\/\s*$/.test(ln)) + 1);
BEGINNING_COMMENT[1] = ' * Language definitions for parser. AUTOMATIC GENERATED (from MediaWiki source). DO NOT EDIT.';
BEGINNING_COMMENT = BEGINNING_COMMENT.join('\n');


let languages = fs.readdirSync(path.join(MEDIAWIKI_SOURCE, 'languages/messages')).map(file => {
    const language = /Messages(.+).php/.exec(file)[1].toLowerCase();
    const lines = fs.readFileSync(path.join(MEDIAWIKI_SOURCE, 'languages/messages', file), {encoding: 'utf8', flag: 'r'}).split(/\r?\n/);
    return {language, lines, fallback: []};
});


function phpAssociativeArrayItemRe(name, valueIsArray=false, nameIsString=true) {
    let n = `['"](${ name })['"]`;
    if(!nameIsString)
        n = `(${ name })`;

    if(valueIsArray)
        return new RegExp(`^\\s*${ n }\\s*=>\\s*\\[(.*?)\\]\\s*,\\s*$`, 'i');
    return new RegExp(`^\\s*${ n }\\s*=>\\s*(.*?)\\s*,\\s*$`, 'i');
}


/**
 * drops " / ' from string begin and end.
 */
function extractStringStr(txt) {
    if(/^\s*(['"])(.*?)\1\s*$/i.test(txt))
        txt = txt.replace(/^\s*(['"])(.*?)\1\s*$/i, '$2');
    return txt;
}


const MEDIAWIKI_NAMESACES = [
    'NS_MEDIA', 'NS_SPECIAL', 'NS_MAIN', 'NS_TALK', 'NS_USER', 'NS_USER_TALK',
    'NS_PROJECT', 'NS_PROJECT_TALK', 'NS_FILE', 'NS_FILE_TALK', 'NS_MEDIAWIKI',
    'NS_MEDIAWIKI_TALK', 'NS_TEMPLATE', 'NS_TEMPLATE_TALK', 'NS_HELP',
    'NS_HELP_TALK', 'NS_CATEGORY', 'NS_CATEGORY_TALK'
]


const EXTRACT_FROM_MESSAGES = [
    {

        // find language description
        find: [
            /^\s*\/\*\*\s*(.+?\s*\([^\)]+?\))/i,  // i.e. /** Chinese (Macau)
            /^\s*\/\*\*\s*(.+?)/i            // i.e. /** Laki
        ],
        saveAs: 'languageDescription'
    }, {

        // language fallback
        find: [
            /\s*\$fallback\s*=\s*'([^\']+?)'/i // i.e. $fallback = 'zh-hk, zh-hant, zh-hans';
        ],
        saveAs: (language, txt) => {
            language.fallback = txt.split(/,\s*/);
        }
    }, {

        // interesting specjal pages
        from: /\$specialPageAliases\s*=\s*\[/i,
        to: /\s*\]\s*;\s*/i,

        find: [
            phpAssociativeArrayItemRe('Upload', /* valueIsArray */ true)
        ],

        saveAs: (language, name, value) => {
            if(!language.specialPageAliases)
                language.specialPageAliases = {}

            name = name.toLowerCase();
            if(!language.specialPageAliases[name])
                language.specialPageAliases[name] = [];
            value = value.split(/(?:'|")(.*?)(?:'|"),?\s*/).filter(Boolean).filter(a => !/^\s+$/.test(a));
            language.specialPageAliases[name].push.apply(language.specialPageAliases[name], value)
        }
    }, {

        // title namespaces
        from: /\$namespaceNames\s*=\s*\[/i,
        to: /\s*\]\s*;\s*/i,

        find: [
            ...MEDIAWIKI_NAMESACES.map(name => phpAssociativeArrayItemRe(name, /* valueIsArray */ false, /* nameIsString */ false))
        ],
        findAll: true,

        saveAs: (language, name, value) => {
            if(!language.namespaceNames) {
                language.namespaceNames = Object.fromEntries(MEDIAWIKI_NAMESACES.map(name => [name, []]));
                language.namespaceNames['NS_PROJECT'] = ['$1'];
            }

            let a = extractStringStr(value);
            if(a)
                language.namespaceNames[name].push(a);
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

                    if(!fnd.findAll)
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
    let {language, languageDescription = '', specialPageAliases = [], namespaceNames} = lng;
    outLangs[language] = {
        languageDescription,
        specialPageAliases,
        namespaceNames
    };
});

fs.writeFileSync(path.resolve(__dirname, 'src/languages.js'), BEGINNING_COMMENT + '\n\n\nexport default ' + JSON.stringify(outLangs, null, 4) + ';', {encoding: 'utf8'});
