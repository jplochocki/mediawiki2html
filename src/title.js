/**
 * Rewritten Title module (includes/Title.php) simplified code from other
 * classes.
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


import { Sanitizer } from './sanitizer.js';
import { DefaultConfig } from './defaultconfig.js';


export class Title {
    constructor(parserConfig=null) {
        // valid namespace consts
        Title.NS_MAIN = 0;
        Title.NS_TALK = 1;
        Title.NS_USER = 2;
        Title.NS_USER_TALK = 3;
        Title.NS_PROJECT = 4;
        Title.NS_PROJECT_TALK = 5;
        Title.NS_FILE = 6;
        Title.NS_FILE_TALK = 7;
        Title.NS_MEDIAWIKI = 8;
        Title.NS_MEDIAWIKI_TALK = 9;
        Title.NS_TEMPLATE = 10;
        Title.NS_TEMPLATE_TALK = 11;
        Title.NS_HELP = 12;
        Title.NS_HELP_TALK = 13;
        Title.NS_CATEGORY = 14;
        Title.NS_CATEGORY_TALK = 15;
        Title.NS_SPECIAL = -1;

        if(parserConfig instanceof DefaultConfig)
            this.parserConfig = parserConfig;
        else
            this.parserConfig = new DefaultConfig(parserConfig);

        // valid namespace names
        // FIXME inne języki
        this.namespaceNames = {};

        this.namespaceNames['en'] = {
            'Media': Title.NS_MEDIA,
            'Special': Title.NS_SPECIAL,
            'Talk': Title.NS_TALK,
            'User': Title.NS_USER,
            'User_talk': Title.NS_USER_TALK,
            '$1': Title.NS_PROJECT,
            '$1_talk': Title.NS_PROJECT_TALK,
            'File': Title.NS_FILE,
            'File_talk': Title.NS_FILE_TALK,
            'MediaWiki': Title.NS_MEDIAWIKI,
            'MediaWiki_talk': Title.NS_MEDIAWIKI_TALK,
            'Template': Title.NS_TEMPLATE,
            'Template_talk': Title.NS_TEMPLATE_TALK,
            'Help': Title.NS_HELP,
            'Help_talk': Title.NS_HELP_TALK,
            'Category': Title.NS_CATEGORY,
            'Category_talk': Title.NS_CATEGORY_TALK
        };

        this.namespaceNames['pl'] = {
            'Media': Title.NS_MEDIA,
            'Specjalna': Title.NS_SPECIAL,
            'Dyskusja': Title.NS_TALK,
            'Użytkownik': Title.NS_USER,
            'Użytkowniczka': Title.NS_USER,
            'Dyskusja_użytkownika': Title.NS_USER_TALK,
            'Dyskusja_użytkowniczki': Title.NS_USER_TALK,
            '$1': Title.NS_PROJECT,
            'Dyskusja_$1': Title.NS_PROJECT_TALK,
            'Plik': Title.NS_FILE,
            'Grafika': Title.NS_FILE,
            'Dyskusja_pliku': Title.NS_FILE_TALK,
            'Dyskusja_grafiki': Title.NS_FILE_TALK,
            'MediaWiki': Title.NS_MEDIAWIKI,
            'Dyskusja_MediaWiki': Title.NS_MEDIAWIKI_TALK,
            'Szablon': Title.NS_TEMPLATE,
            'Dyskusja_szablonu': Title.NS_TEMPLATE_TALK,
            'Pomoc': Title.NS_HELP,
            'Dyskusja_pomocy': Title.NS_HELP_TALK,
            'Kategoria': Title.NS_CATEGORY,
            'Dyskusja_kategorii': Title.NS_CATEGORY_TALK
        };

        this.namespacesWithSubpages = [
            Title.NS_TALK,
            Title.NS_USER,
            Title.NS_USER_TALK,
            Title.NS_PROJECT,
            Title.NS_PROJECT_TALK,
            Title.NS_FILE_TALK,
            Title.NS_MEDIAWIKI,
            Title.NS_MEDIAWIKI_TALK,
            Title.NS_TEMPLATE,
            Title.NS_TEMPLATE_TALK,
            Title.NS_HELP,
            Title.NS_HELP_TALK,
            Title.NS_CATEGORY_TALK
        ];

        if(this.parserConfig.projectName) {
            Object.values(this.namespaceNames).forEach(names => {
                names[Title.NS_PROJECT] = names[Title.NS_PROJECT].replace('$1', this.parserConfig.projectName);
                names[Title.NS_PROJECT_TALK] = names[Title.NS_PROJECT_TALK].replace('$1', this.parserConfig.projectName);
            });
        }
        else { // no project name = don't resolve NS_PROJECT / NS_PROJECT_TALK names
            Object.values(this.namespaceNames).forEach(names => {
                delete names[Title.NS_PROJECT];
                delete names[Title.NS_PROJECT_TALK];
            });
        }

        this.mNamespace = Title.NS_MAIN;
        this.mDbkeyform = null;
        this.mInterwiki = '';
        this.mFragment = '';
        this.mUrlform = '';
        this.mTextform = '';
    }


    /**
     * Create a new Title from text, such as what one would find in a link. De-
     * codes any HTML entities in the text.
     *
     * @param String text
     * @param Object [parserConfig=null]
     * @return Title
     */
    static newFromText(text, parserConfig=null) {
        // DWIM: Integers can be passed in here when page titles are used as array keys.
        if(typeof text != 'string' && typeof text != 'number')
            throw new Error('Text must be a string.');

        if(!text)
            return null;

        // Convert things like &eacute; &#257; or &#x3017; into normalized (T16952) text
        const filteredText = Sanitizer.decodeCharReferencesAndNormalize(text);

        const t = new Title(parserConfig);
        t.mDbkeyform = filteredText.replace(/ /g, '_');
        t.mNamespace = Title.NS_MAIN;

        t.secureAndSplit();

        return t;
    }


    /**
     * Secure and split - main initialisation function for this object
     *
     * Assumes that mDbkeyform has been set, and is urldecoded
     * and uses underscores, but not otherwise munged.  This function
     * removes illegal characters, splits off the interwiki and
     * namespace prefixes, sets the other forms, and canonicalizes
     * everything.
     *
     * @return bool True on success
     */
    secureAndSplit() {
        // MediaWikiTitleCodec.splitTitleString short reimplementation
        // Strip Unicode bidi override characters.
        this.mDbkeyform = this.mDbkeyform.replace(/[\u200E\u200F\u202A-\u202E]+/gu, '');

        // Clean up whitespace
        this.mDbkeyform = this.mDbkeyform.replace(/[ _\xA0\u1680\u180E\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]+/gu, '_');
        this.mDbkeyform = this.mDbkeyform.replace(/(^_*)|(_*$)/g, '');

        const UTF8_REPLACEMENT = '\xef\xbf\xbd';
        if(this.mDbkeyform.indexOf(UTF8_REPLACEMENT) != -1)
            // Contained illegal UTF-8 sequences or forbidden Unicode chars.
            throw new Error('The requested page title contains an invalid UTF-8 sequence.');

        // Initial colon indicates main namespace rather than specified default
        // but should not create invalid {ns,title} pairs such as {0,Project:Foo}
        if(this.mDbkeyform != '' && this.mDbkeyform[0] == ':') {
            this.mNamespace = Title.NS_MAIN;
            this.mDbkeyform = this.mDbkeyform.substr(1); // remove the colon but continue processing
            this.mDbkeyform = this.mDbkeyform.replace(/^_*/, ''); // remove any subsequent whitespace
        }

        // Namespace or interwiki prefix
        let m = null;
        if((m = /^(.+?)_*:_*(.*)$/g.exec(this.mDbkeyform))) {
            let ns = this.getNsIndex(m[1]);

            if(ns !== false) {
                // Ordinary namespace
                this.mDbkeyform = m[2];
                this.mNamespace = ns;

                // Talk:X pages - skipped
            }
            else if(this.isValidInterwiki(m[1])) {
                // Interwiki link
                this.mDbkeyform = m[2];
                this.mInterwiki = m[1];

                // If there's an initial colon after the interwiki, that also
                // resets the default namespace
                if(this.mDbkeyform != '' && this.mDbkeyform[0] == ':') {
                    this.mNamespace = Title.NS_MAIN;
                    this.mDbkeyform = this.mDbkeyform.substr(1);
                    this.mDbkeyform = this.mDbkeyform.replace(/^_*/, '');
                }
            }

            // If there's no recognized interwiki or namespace,
            // then let the colon expression be part of the title.
        }

        // non empty title only
        if(this.mDbkeyform == '')
            throw new Error('The requested page title is empty or contains only the name of a namespace.')

        // fragment
        const fragment = this.mDbkeyform.indexOf('#');
        if(fragment != -1) {
            this.mFragment = this.mDbkeyform.substr(fragment + 1);
            this.mDbkeyform = this.mDbkeyform.substr(0, fragment);

            // remove whitespace again: prevents "Foo_bar_#"
            // becoming "Foo_bar_"
            this.mDbkeyform = this.mDbkeyform.replace(/_*$/g, '');
        }

        // Reject illegal characters.
        if((m = Title.getTitleInvalidRegex().exec(this.mDbkeyform)))
            throw new Error(`The requested page title contains invalid characters: "${ m[0] }".`);

        // Pages with "/./" or "/../" appearing in the URLs will often be un-
        // reachable due to the way web browsers deal with 'relative' URLs.
        // Also, they conflict with subpage syntax.  Forbid them explicitly.
        if(this.mDbkeyform.indexOf('.') != -1 && (
                this.mDbkeyform == '.' || this.mDbkeyform == '..' || this.mDbkeyform.indexOf('./') == 0
                || this.mDbkeyform.indexOf('../') == 0 || this.mDbkeyform.indexOf('/./') != -1
                || this.mDbkeyform.indexOf(/../) != -1 || /\/\.$/.test(this.mDbkeyform)
                || /\/\.\.$/.test(this.mDbkeyform)))
            throw new Error('Title has relative path. Relative page titles (./, ../) are invalid, because they will often be unreachable when handled by user\'s browser.');

        // Magic tilde sequences? Nu-uh!
        if(this.mDbkeyform.indexOf('~~~') != -1)
            throw new Error('The requested page title contains invalid magic tilde sequence (<nowiki>~~~</nowiki>).')

        // Limit the size of titles to 255 bytes. This is typically the size of the
        // underlying database field. We make an exception for special pages, which
        // don't need to be stored in the database, and may edge over 255 bytes due
        // to subpage syntax for long titles, e.g. [[Special:Block/Long name]]
        const maxLength = this.mNamespace != Title.NS_SPECIAL ? 255 : 512;
        if(this.mDbkeyform.length > maxLength)
            throw new Error(`The requested page title is too long. It must be no longer than ${ maxLength } bytes in UTF-8 encoding.`)

        // Normally, all wiki links are forced to have an initial capital letter so [[foo]]
        // and [[Foo]] point to the same place.  Don't force it for interwikis, since the
        // other site might be case-sensitive.
        this.mDbkeyform = this.mDbkeyform[0].toUpperCase() + this.mDbkeyform.substr(1);

        // Can't make a link to a namespace alone... "empty" local links can only be
        // self-links with a fragment identifier.
        if(this.mDbkeyform == '' && this.mInterwiki == '' && this.mNamespace != Title.NS_MAIN)
            throw new Error('The requested page title is empty or contains only the name of a namespace.')

        //  IPv6 usernames - skipped

        // Any remaining initial :s are illegal.
        if(this.mDbkeyform != '' && this.mDbkeyform[0] == ':')
            throw new Error('The requested page title contains an invalid colon at the beginning.');

        this.mUrlform = encodeURIComponent(this.mDbkeyform);
        this.mTextform = this.mDbkeyform.replace(/_/g, ' ');

        return true;
    }


    /**
     * Check namespace number by its name (return false if namespace not found)
     *
     * @param String ns
     * @return Number|Boolean
     */
    getNsIndex(ns) {
        let a = Object.keys(this.namespaceNames[this.parserConfig.language]).find(k => k == ns);
        return (a == undefined) ? false : this.namespaceNames[this.parserConfig.language][a];
    }


    /**
     * Get the namespace text
     *
     * @param Number [ns] optional. If not set - this.mNamespace is used
     * @return string|false
     */
    getNsText(ns=false) {
        ns = ns === false ? this.mNamespace : ns;
        let a = Object.entries(this.namespaceNames[this.parserConfig.language]).find(([k, v]) => v == ns);
        return a ? a[0] : false;
    }


    /**
     * Get a regex character class describing the legal characters in a link
     *
     * @return String
     */
    static legalChars() {
        return " %!\"$&'()*,\\-.\\/0-9:;=?@A-Z\\\\^_`a-z~\\x80-\\xFF+";
    }


    /**
     * Returns a simple regex that will match on characters and sequences invalid in titles.
     * Note that this doesn't pick up many things that could be wrong with titles, but that
     * replacing this regex with something valid will make many titles valid.
     * Previously Title::getTitleInvalidRegex()
     *
     * @return string Regex string
     * @since 1.25
     */
    static getTitleInvalidRegex() {
        return new RegExp(
            // Any character not allowed is forbidden...
            '[^' + Title.legalChars() + ']' +
            // URL percent encoding sequences interfere with the ability
            // to round-trip titles -- you can't link to them consistently.
            '|%[0-9A-Fa-f]{2}' +
            // XML/HTML character references produce similar issues.
            '|&[A-Za-z0-9\x80-\xff]+;' +
            '|&#[0-9]+;' +
            '|&#x[0-9A-Fa-f]+;', 'g');
    }


    /**
     * Get the main part with underscores
     *
     * @return string
     */
    getDBkey() {
        return this.mDbkeyform;
    }


    /**
     * Get the namespace index, i.e. one of the NS_xxxx constants.
     *
     * @return Number
     */
    getNamespace() {
        return this.mNamespace;
    }


    /**
     * Get the interwiki prefix
     *
     * @return String Interwiki prefix
     */
    getInterwiki() {
        return this.mInterwiki;
    }


    /**
     * Is this Title interwiki?
     *
     * @return bool
     */
    isExternal() {
        return this.mInterwiki != '';
    }


    /**
     * Check if namespace is valid interwiki name
     *
     * @param String ns
     * @return Boolean
     */
    isValidInterwiki(ns) {
        return this.parserConfig.validInterwikiNames.includes(ns);
    }


    /**
     * Get the Title fragment (i.e.\ the bit after the #) in text form
     *
     * @return string
     */
    getFragment() {
        return this.mFragment;
    }


    /**
     * Check if a Title fragment is set
     *
     * @return bool
     */
    hasFragment() {
        return this.mFragment != '';
    }


    /**
     * Compare with another title.
     *
     * @param Title title
     * @return bool
     */
    equals(title) {
        // Note: === is necessary for proper matching of number-like titles.
        return this.mInterwiki == title.getInterwiki()
            && this.mNamespace == title.getNamespace()
            && this.mDbkeyform === title.getDBkey();
    }


    /**
     * Get the prefixed title with spaces.
     * This is the form usually used for display
     *
     * @param Boolean [skipInterwiki=false]
     * @param Boolean [forUrl=false]
     * @return string The prefixed title, with spaces
     */
    getPrefixedText(skipInterwiki=false, forUrl=false) {
        let t = '';
        if(!skipInterwiki && this.isExternal())
            t = this.mInterwiki + ':';

        if(this.mNamespace != 0) {
            let nsText = this.getNsText();
            if(nsText === false)
                // See T165149. Awkward, but better than erroneously linking to the main namespace.
                nsText = this.getNsText(Title.NS_SPECIAL) + `:Badtitle/NS${ this.mNamespace }`;
            t += nsText + ':';
        }

        if(forUrl)
            t += this.mDbkeyform;
        else
            t += this.mDbkeyform.replace(/_/g, ' ');

        return t;
    }


    /**
     * Get the text form (spaces not underscores) of the main part
     *
     * @return String
     */
    getText() {
        return this.mTextform;
    }


    /**
     * Get the prefixed database key form
     *
     * @return string
     */
    getPrefixedDBkey() {
        return this.getPrefixedText().replace(/ /g, '_');
    }


    /**
     * Get the URL-encoded form of the main part
     */
    getPartialURL() {
        return this.mUrlform;
    }


    /**
     * Check if page exists
     *
     * @return bool
     */
    exists() {
        if(this.mDbkeyform == '' && this.hasFragment())
            return true;

        return this.parserConfig.titleExists(this)
    }


    /**
     * Should links to this title be shown as potentially viewable (i.e. as
     * "bluelinks"), even if there's no record by this title in the page
     * table?
     *
     * @return bool
     */
    isAlwaysKnown() {
        if(this.mInterwiki != '')
            return true; // any interwiki link might be viewable, for all we know

        switch(this.mNamespace) {
            case Title.NS_MEDIA:
            case Title.NS_FILE:
            case Title.NS_SPECIAL:
            case Title.NS_MEDIAWIKI:
                return true;
            case Title.NS_MAIN:
                // selflink, possibly with fragment
                return this.mDbkeyform == '';
            default:
                return false;
        }
    }


    /**
     * Does this title refer to a page that can (or might) be meaningfully
     * viewed?
     *
     * @return bool
     */
    isKnown() {
        return this.isAlwaysKnown() || this.exists();
    }


    /**
     * Get a real URL referring to this title, with interwiki link query and
     * fragment
     *
     * @param URLSearchParams|Object|Array|String [query]
     * @param String [proto='//'] Protocol type to use in URL ('//' - relative, 'http://', 'https://')
     * @param Boolean [skipFragment=false]
     * @return string The URL
     */
    getFullURL(query=null, proto='//', skipFragment=false) {
        let url = this.parserConfig.getFullUrl(this, query, proto);
        if(url)
            return url;

        // redirect to fragment only
        if(this.mFragment != '' && this.mDbkeyform == '' && !query)
            return '#' + this.mFragment;

        // reduce query to string
        if(!(query instanceof URLSearchParams))
            query = new URLSearchParams(query ? query : '');
        query.set('title', this.getPrefixedText(true, true));

        query = new URLSearchParams([['title', query.get('title')], ...Array.from(query.entries()).filter(([k,]) => k != 'title')]); // title should be first query param

        const longQuery = Array.from(query.values()).length > 1 || !query.has('title');
        query = query.toString();
        if(query[0] != '?')
            query = '?' + query;

        // interwiki
        let server = this.parserConfig.server;
        if(this.isExternal())
            server = this.parserConfig.interwikiServer.replace(/\$3/g, this.mInterwiki);

        // generate url
        url = longQuery ? this.parserConfig.queryArticlePath : this.parserConfig.articlePath;
        url = url.replace(/\$1/g, query).replace(/\$2/g, this.getPrefixedText(true, true));
        url = server.replace(/\$1/g, proto).replace(/\$2/g, url);

        if(!skipFragment && this.mFragment != '')
            url += '#' + this.mFragment;

        return url;
    }


    /**
     * Get the edit URL for this Title (if not interwiki)
     *
     * @return String
     */
    getEditURL() {
        if(this.isExternal())
            return '';

        return this.getFullURL({action: 'edit'});
    }


    /**
     * Get url for image (ie. /images/a/af/LoremIpsum.png)
     */
    getImageUrl() {
        let a = md5(this.mUrlform);
        return `${ this.parserConfig.imageFileUrl }${ a[0] }/${ a[0] + a[1] }/${ this.mUrlform }`;
    }


    /**
     * Get url for image thumb (ie. /images/thumb/a/af/LoremIpsum.png/150px-LoremIpsum.png)
     */
    getThumbUrl(width) {
        let a = md5(this.mUrlform);
        return `${ this.parserConfig.thumbFileUrl }${ a[0] }/${ a[0] + a[1] }/${ this.mUrlform }/${ width }px-${ this.mUrlform }`;
    }


    /**
     * Get upload link for image file
     */
    getImageUploadUrl() {
        let q = {
            ...this.parserConfig.uploadFileParams
        };

        if(q.wpDestFile)
            q.wpDestFile = this.getPartialURL();
        q = '?' + new URLSearchParams(q).toString();

        return this.parserConfig.uploadFileURL.replace(/\$1/g, q);
    }


    /**
     * Get the lowest-level subpage name, i.e. the rightmost part after any slashes
     *
     * @par Example:
     * @code
     * Title.newFromText('User:Foo/Bar/Baz').getSubpageText();
     * # returns: "Baz"
     * @endcode
     *
     * @return string Subpage name
     */
    getSubpageText() {
        if(this.namespacesWithSubpages.indexOf(this.mNamespace) == -1)
            return this.mTextform;
        let parts = this.mTextform.split('/');
        return parts.pop();
    }


    /**
     * Get the title for a subpage of the current page
     *
     * @par Example:
     * @code
     * Title.newFromText('User:Foo/Bar/Baz').getSubpage('Asdf');
     * # returns: Title{User:Foo/Bar/Baz/Asdf}
     * @endcode
     *
     * @param string $text The subpage name to add to the title
     * @return Title|null Subpage title, or null on an error
     */
    getSubpage(text) {
        return Title.newFromText(this.getPrefixedText() + '/' + text);
    }


    /**
     * Get all subpages of this page.
     *
     * @return Title[] Title array, or empty array if this page's namespace
     *  doesn't allow subpages
     */
    getSubpages() {
        if(this.namespacesWithSubpages.indexOf(this.mNamespace) == -1)
            return [];

        let parts = this.getPrefixedText().split('/');
        let lastTitle = Title.newFromText(parts.shift());

        return parts.map(part => {
            lastTitle = lastTitle.getSubpage(part);
            return lastTitle;
        });
    }


    /**
     * Does this have subpages?
     *
     * @return Boolean
     */
    hasSubpages() {
        return this.getSubpages().length > 0;
    }


    /**
     * Get the base page name without a namespace, i.e. the part before the subpage name
     *
     * @par Example:
     * @code
     * Title.newFromText('User:Foo/Bar/Baz').getBaseText();
     * # returns: 'Foo/Bar'
     * @endcode
     *
     * @return string Base name
     */
    getBaseText() {
        if(this.namespacesWithSubpages.indexOf(this.mNamespace) == -1)
            return this.mTextform;

        let parts = this.mTextform.split('/');
        if(parts.length == 1)
            return this.mTextform;

        parts.pop();
        return parts.reduce((txt, part) => txt + (txt != '' ? '/' : '') + part, '');
    }
}
