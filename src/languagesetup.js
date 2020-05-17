/**
 * Language setup for parser.
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


import languages from './languages.js';
import { Title, NAMESPACES } from './title.js';


/**
 * Language definitions setup class
 *
 * @class LanguageSetup
 */
export class LanguageSetup {
    /**
     *
     * @param {String} langName short language ID (e.g. '`en`', '`pl`')
     */
    constructor(langName='en') {
        this.languageName = langName.toLowerCase();
        this.currentLanguage = languages[this.languageName];

        if(!this.currentLanguage)
            throw new Error(`Language '${ langName }' not available.`);

        this.defaultLanguage = this;
        if(this.languageName != 'en') // english is default language
            this.defaultLanguage = new LanguageSetup('en');
    }


    /**
     * Convert namespace number (e.g. `Title.NS_MAIN` const) or name
     * (e.g. `NS_MAIN` string) to localized namespace name
     *
     * @param {String|Number} namespace
     * @return {String} returns empty string on unknown namespace
     */
    getNamespaceName(namespace) {
        if(typeof namespace == 'number') {
            namespace = Object.entries(NAMESPACES).find(([name, value]) => value == namespace);
            if(!Array.isArray(namespace))
                return '';
            namespace = namespace[0].toUpperCase();
        }

        let a = Object.entries(this.currentLanguage.namespaceNames).find(([name, value]) => name == namespace);
        if(Array.isArray(a) && Array.isArray(a[1]) && a[1].length > 0)
            return a[1][0];

        return '';
    }


    /**
     * Gets name of special page in current language.
     *
     * @param {String} enName english page name (e.g. 'upload'). Case
     * insensitive.
     * @return {String} returns empty string when page not found
     */
    getSpecialPageName(enName) {
        const ns = this.getNamespaceName('NS_SPECIAL');

        let a = this.currentLanguage.specialPageAliases[enName.toLowerCase()];
        if(Array.isArray(a) && a.length > 0)
            return `${ ns }:${ a[0] }`;

        // try use english name
        if(this.languageName != 'en')
            return this.defaultLanguage.getSpecialPageName(enName);

        return '';
    }


    /**
     * Gets Title object for specjal page (with name in current language)
     *
     * @param {String} enName english page name (e.g. 'upload'). Case
     * insensitive.
     * @param {DefaultConfig} parserConfig parser config instance for Title
     * object
     * @return {Title}
     */
    getSpecialPageTitle(enName, parserConfig) {
        return Title.newFromText(this.getSpecialPageName(enName), parserConfig)
    }
};
