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


class Title {
    constructor() {
        // valid namespace consts
        if(Title.NS_MAIN === undefined) {
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
        }

        // valid namespace names
        // FIXME inne języki
        this.namespaceNames = {};

        this.namespaceNames['en'] = {
            'Media': Title.NS_MEDIA,
            'Special': Title.NS_SPECIAL,
            //'': Title.NS_MAIN,
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

        this.validInterwikiNames = [];

        this.mNamespace = Title.NS_MAIN;
        this.mDefaultNamespace = Title.NS_MAIN;
        this.mDbkeyform = null;
        this.mInterwiki = '';
    }


    /**
     * Create a new Title from text, such as what one would find in a link. De-
     * codes any HTML entities in the text.
     */
    static newFromText(text, defaultNamespace=Title.NS_MAIN) {
        if(!text)
            return null;

        // DWIM: Integers can be passed in here when page titles are used as array keys.
        if(typeof text != 'string' && typeof text != 'number')
            throw new Error('text must be a string.');

        // Convert things like &eacute; &#257; or &#x3017; into normalized (T16952) text
        const filteredText = Sanitizer.decodeCharReferencesAndNormalize(text);

        const t = new Title();
        t.mDbkeyform = filteredText.replace(/ /g, '_');
        t.mDefaultNamespace = Number(defaultNamespace);

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
        // FIXME - konfiguracja, wybór języka
        const lang = 'en';
        let a = Object.keys(this.namespaceNames[lang]).find(k => k == ns);
        if(a == undefined)
            return false;
        return this.namespaceNames[lang][a];
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
     * Check if namespace is valid interwiki name
     *
     * @param String ns
     * @return Boolean
     */
    isValidInterwiki(ns) {
        return this.validInterwikiNames.includes(ns);
    }

}
