/**
 * Default configuration generator for MWParser.
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


import { LanguageSetup } from './languagesetup.js';
import languages from './languages.js';


/**
 * Default configuration generator for MWParser
 *
 * @class DefaultConfig
 */
export class DefaultConfig {
    constructor(config=null) {
        /**
         * Language of parsed Wiki text (default `en`).
         *
         * @type {String}
         */
        this.language = 'en';

        this.contentLanguage = new LanguageSetup(
            config && config.language? config.language : 'en',
            config && config.projectName? config.projectName : '');


        /**
         * project name (like `$wgSitename`, e.g. used for namespaces
         * `Title.NS_PROJECT` and `Title.NS_PROJECT_TALK`).
         *
         * @type {String}
         */
        this.projectName = '';


        /**
         * This page title. Currently used for edit section links in **TOC** and
         * for some **Magic Variables** (e.g  `{{PAGENAME}}`, `{{FULLPAGENAME}}`,
         * `{{NAMESPACE}}`).
         *
         * @type {String}
         */
        this.pageTitle = 'Main page';


        /**
         * Base template for wiki page URL with query.
         * Template params:
         * * `$PROTOCOL` - protocol scheme (e.g. '`https://`')
         * * `$QUERY` - query part of url
         *
         * @type {String}
         */
        this.baseUrlForQuery = `$PROTOCOL${ this.language }.wikipedia.org/w/index.php?$QUERY`;


        /**
         * Base template for wiki page URL only (without query).
         * Template params:
         * * `$PROTOCOL` - protocol scheme (e.g. '`https://`')
         * * `$TITLE` - title
         * * `$QUERY` - query part of url (optional; don't use with $TITLE)
         *
         * @type {String}
         */
        this.baseUrlForTitle = this.baseUrlForQuery;


        /**
         * Base template for wiki URLs. Template params:
         * * `$PROTOCOL` - protocol scheme  (e.g. '`https://`')
         * * `$LANGUAGE` - interwiki language
         * * `$QUERY` - query part of url
         *
         * @type {String}
         */
        this.interwikiUrl = `$PROTOCOL$LANGUAGE.wikipedia.org/w/index.php?$QUERY`;



        this.validInterwikiNames = [];

        this.externalLinkTarget = false; // setting to _blank may represent a security risk
        this.defaultThumbSize = 300;
        this.thumbUpright = 0.75;
        this.wgResponsiveImages = true;

        this.uploadMissingFileUrl = true;


        // override default config with user defined
        if(config)
            Object.entries(config).forEach(([k, v]) => this[k] = v);
    }


    /**
     * Check if title exists (also test if file exists)
     *
     * @param {Title|String} title
     * @return {Boolean}
     */
    titleExists(title) {
        return true;
    }


    /**
     * Overrides Title.getFullURL if return truthy. Use for generate your own
     * url for title.
     *
     * @param {Title} title
     * @param {URLSearchParams|Object|Array|String} [query]
     * @param {String} [proto='//'] Protocol type to use in URL ('//' - relative, 'http://', 'https://')
     * @return {String}
     */
    getFullURL(title, query=null, proto='//') {
        return false;
    }


    /**
     * Function is checking if image can be displayed
     * (false - display image page link instead)
     *
     * @param {Title} title
     * @return {Boolean}
     */
    allowImageDisplay(title) {
        return true;
    }


    /**
     * Make thumb image (or thumb image information).
     *
     */
    makeThumb(title, width=false, height=false, doNotZoomIn=false) {
        return false;
        // return {
        //     url: '',
        //     width: 0,
        //     height: 0
        // };
    }


    /**
     * Get url for image (ie. /images/a/af/LoremIpsum.png). Overrides Title.getImageURL if return truthy.
     *
     * @return {String}
     */
    getImageURL(title) {
        return false;
    }


    /**
     * Get relative url for image thumb (ie. /images/thumb/a/af/LoremIpsum.png/150px-LoremIpsum.png). Overrides Title.getThumbURL if return truthy.
     *
     * @param {Number} width thumb width
     * @return {String}
     */
    getThumbURL(width) {
        return false;
    }


    /**
     * Allow display external image as <img> tag
     */
    allowExternalImage(url) {
        return false;
    }


    /**
     * Get template source for title
     *
     * @param String title
     * @return String
     */
    getTemplate(title) {
        return false;
    }


    /**
     * Registers new Magic Variables
     *
     * @return [{{id: String, synonyms: String[], caseSensitive: Boolean}}]
     */
    registerNewMagicVariables() {
        return [];
    }


    /**
     * Changes the output for a given Magic Variable
     *
     */
    changeMagicVariableOutput(variableId, defaultOutput) {
        return defaultOutput;
    }


    /**
     * Called by parser when parser function needed (eg. {{sum:1|2|3}}). Return
     * parser function result text or false, when function in unknown.
     *
     * @param String funcName
     * @param Object args
     * @return String|false
     */
    callParserFunction(funcName, args) {
        return false;
    }
};
