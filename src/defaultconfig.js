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


class DefaultConfig {
    constructor(config=null) {
        this.language = 'en';
        this.useLinkPrefixExtension = false;
        this.isRightAlignedLanguage = false;
        this.projectName = '';
        this.pageTitle = 'Main page';
        this.server = `$1${ this.language }.wikipedia.org$2`;
        this.interwikiServer = `$1$3.wikipedia.org$2`;
        this.articlePath = '/w/index.php$1';
        this.validInterwikiNames = [];
        this.externalLinkTarget = false; // setting to _blank may represent a security risk
        this.defaultThumbSize = 300;
        this.thumbUpright = 0.75;
        this.wgResponsiveImages = true;
        this.uploadMissingFileUrl = true;
        this.uploadFileURL = `//${ this.server.replace(/\$(1|2)/g, '') }${ this.articlePath }`;
        this.uploadFileParams = {
            title: 'Special:Upload',
            wpDestFile: true
        };
        this.imageFileUrl = '/images/';
        this.thumbFileUrl = '/images/thumb/';

        // TODO magic words for other languages
        this.magicWords = {
            img_thumbnail: ['thumb', 'thumbnail'],
            img_manualthumb: ['thumbnail=$1', 'thumb=$1'],
            img_right: ['right'],
            img_left: ['left'],
            img_none: ['none'],
            img_width: ['$1px'],
            img_center: ['center', 'centre'],
            img_framed: ['frame', 'framed', 'enframed'],
            img_frameless: ['frameless'],
            img_lang: ['lang=$1'],
            img_page: ['page=$1', 'page $1'],
            img_upright: ['upright', 'upright=$1', 'upright $1'],
            img_border: ['border'],
            img_baseline: ['baseline'],
            img_sub: ['sub'],
            img_super: ['super', 'sup'],
            img_top: ['top'],
            img_text_top: ['text-top'],
            img_middle: ['middle'],
            img_bottom: ['bottom'],
            img_text_bottom: ['text-bottom'],
            img_link: ['link=$1'],
            img_alt: ['alt=$1'],
            img_class: ['class=$1'],
        };

        // override default config with user defined
        if(config)
            Object.entries(config).forEach(([k, v]) => this[k] = v);
    }


    /**
     * Check if title exists (also test if file exists)
     *
     * @param Title|String title
     * @return Boolean
     */
    titleExists(title) {
        return true;
    }


    /**
     * Overrides Title.getFullUrl if return truthy. Use for generate your own
     * url for title.
     *
     * @param Title title
     * @param URLSearchParams|Object|Array|String [query]
     * @param String [proto='//'] Protocol type to use in URL ('//' - relative, 'http://', 'https://')
     * @return String
     */
    getFullUrl(title, query=null, proto='//') {
        return '';
    }


    /**
     * Function is checking if image can be displayed
     * (false - display image page link instead)
     *
     * @param Title title
     * @return Boolean
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
};
