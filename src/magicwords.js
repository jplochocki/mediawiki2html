/**
 * MagicWords store & expand.
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


class MagicWords {
    constructor(parser) {
        this.parser = parser;

        this.variables = [
            ['!', ['!'], true],
            ['currentmonth', ['CURRENTMONTH', 'CURRENTMONTH2'], true],
            ['currentmonth1', ['CURRENTMONTH1'], true],
            ['currentmonthname', ['CURRENTMONTHNAME'], true],
            ['currentmonthnamegen', ['CURRENTMONTHNAMEGEN'], true],
            ['currentmonthabbrev', ['CURRENTMONTHABBREV'], true],
            ['currentday', ['CURRENTDAY'], true],
            ['currentday2', ['CURRENTDAY2'], true],
            ['currentdayname', ['CURRENTDAYNAME'], true],
            ['currentyear', ['CURRENTYEAR'], true],
            ['currenttime', ['CURRENTTIME'], true],
            ['currenthour', ['CURRENTHOUR'], true],
            ['localmonth', ['LOCALMONTH', 'LOCALMONTH2'], true],
            ['localmonth1', ['LOCALMONTH1'], true],
            ['localmonthname', ['LOCALMONTHNAME'], true],
            ['localmonthnamegen', ['LOCALMONTHNAMEGEN'], true],
            ['localmonthabbrev', ['LOCALMONTHABBREV'], true],
            ['localday', ['LOCALDAY'], true],
            ['localday2', ['LOCALDAY2'], true],
            ['localdayname', ['LOCALDAYNAME'], true],
            ['localyear', ['LOCALYEAR'], true],
            ['localtime', ['LOCALTIME'], true],
            ['localhour', ['LOCALHOUR'], true],
            ['numberofarticles', ['NUMBEROFARTICLES'], true],
            ['numberoffiles', ['NUMBEROFFILES'], true],
            ['numberofedits', ['NUMBEROFEDITS'], true],
            ['articlepath', ['ARTICLEPATH'], false],
            ['pageid', ['PAGEID'], false],
            ['sitename', ['SITENAME'], true],
            ['server', ['SERVER'], false],
            ['servername', ['SERVERNAME'], false],
            ['scriptpath', ['SCRIPTPATH'], false],
            ['stylepath', ['STYLEPATH'], false],
            ['pagename', ['PAGENAME'], true],
            ['pagenamee', ['PAGENAMEE'], true],
            ['fullpagename', ['FULLPAGENAME'], true],
            ['fullpagenamee', ['FULLPAGENAMEE'], true],
            ['namespace', ['NAMESPACE'], true],
            ['namespacee', ['NAMESPACEE'], true],
            ['namespacenumber', ['NAMESPACENUMBER'], true],
            ['currentweek', ['CURRENTWEEK'], true],
            ['currentdow', ['CURRENTDOW'], true],
            ['localweek', ['LOCALWEEK'], true],
            ['localdow', ['LOCALDOW'], true],
            ['revisionid', ['REVISIONID'], true],
            ['revisionday', ['REVISIONDAY'], true],
            ['revisionday2', ['REVISIONDAY2'], true],
            ['revisionmonth', ['REVISIONMONTH'], true],
            ['revisionmonth1', ['REVISIONMONTH1'], true],
            ['revisionyear', ['REVISIONYEAR'], true],
            ['revisiontimestamp', ['REVISIONTIMESTAMP'], true],
            ['revisionuser', ['REVISIONUSER'], true],
            ['revisionsize', ['REVISIONSIZE'], true],
            ['subpagename', ['SUBPAGENAME'], true],
            ['subpagenamee', ['SUBPAGENAMEE'], true],
            ['talkspace', ['TALKSPACE'], true],
            ['talkspacee', ['TALKSPACEE'], true],
            ['subjectspace', ['SUBJECTSPACE', 'ARTICLESPACE'], true],
            ['subjectspacee', ['SUBJECTSPACEE', 'ARTICLESPACEE'], true],
            ['talkpagename', ['TALKPAGENAME'], true],
            ['talkpagenamee', ['TALKPAGENAMEE'], true],
            ['subjectpagename', ['SUBJECTPAGENAME', 'ARTICLEPAGENAME'], true],
            ['subjectpagenamee', ['SUBJECTPAGENAMEE', 'ARTICLEPAGENAMEE'], true],
            ['numberofusers', ['NUMBEROFUSERS'], true],
            ['numberofactiveusers', ['NUMBEROFACTIVEUSERS'], true],
            ['numberofpages', ['NUMBEROFPAGES'], true],
            ['currentversion', ['CURRENTVERSION'], true],
            ['rootpagename', ['ROOTPAGENAME'], true],
            ['rootpagenamee', ['ROOTPAGENAMEE'], true],
            ['basepagename', ['BASEPAGENAME'], true],
            ['basepagenamee', ['BASEPAGENAMEE'], true],
            ['currenttimestamp', ['CURRENTTIMESTAMP'], true],
            ['localtimestamp', ['LOCALTIMESTAMP'], true],
            ['directionmark', ['DIRECTIONMARK', 'DIRMARK'], true],
            ['contentlanguage', ['CONTENTLANGUAGE', 'CONTENTLANG'], true],
            ['pagelanguage', ['PAGELANGUAGE'], true],
            ['numberofadmins', ['NUMBEROFADMINS'], true],
            ['cascadingsources', ['CASCADINGSOURCES'], true],
        ].map(([id, synonyms, caseSensitive]) => ({
            id,
            synonyms,
            caseSensitive,
            synonymsRE: new RegExp('^(' + synonyms.join('|') + ')$', caseSensitive? '' : 'i')
        }));

        this.variables = [...this.variables, ...this.parser.parserConfig.registerNewMagicVariables()];

        this.doubleUnderscores = [
            ['notoc', ['__NOTOC__'], false],
            ['nogallery', ['__NOGALLERY__'], false],
            ['forcetoc', ['__FORCETOC__'], false],
            ['toc', ['__TOC__'], false],
            ['noeditsection', ['__NOEDITSECTION__'], false],
            ['newsectionlink', ['__NEWSECTIONLINK__'], true],
            ['nonewsectionlink', ['__NONEWSECTIONLINK__'], true],
            ['notitleconvert', ['__NOTITLECONVERT__', '__NOTC__'], false],
            ['nocontentconvert', ['__NOCONTENTCONVERT__', '__NOCC__'], false],
            ['hiddencat', ['__HIDDENCAT__'], true],
            ['expectunusedcategory', ['__EXPECTUNUSEDCATEGORY__'], true],
            ['index', ['__INDEX__'], true],
            ['noindex', ['__NOINDEX__'], true],
            ['staticredirect', ['__STATICREDIRECT__'], false],
        ].map(([id, synonyms, caseSensitive]) => ({
            id,
            synonyms,
            caseSensitive,
            synonymsRE: new RegExp('(' + synonyms.join('|') + ')', caseSensitive? 'g' : 'gi')
        }));

        this.substIDs = [
            'subst',
            'safesubst',
        ];

        this.imageMagicWords = {
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
    }


    /**
     * Match words at start, returns object {matchedWord or false, rest of text}.
     * I.e. subst:text -> {matchedWord: 'subst', text: 'text'}
     *
     * @param String text
     * @param String[] words
     * @param Boolean [ignoreCase=true]
     * @return Object
     */
    matchAtStart(text, words, ignoreCase=true) {
        let re = (new RegExp('^(' + words.join('|') + '):(.*)$', (ignoreCase ? 'i' : ''))).exec(text);
        if(re)
            return {matchedWord: re[1].toLowerCase(), text: re[2]};

        return {matchedWord: false, text};
    }


    /**
     * Match subst / safesubst at start, returns object {subst, text}
     *
     * @param String text
     * @return Object
     */
    matchSubstAtStart(text) {
        let {matchedWord, text: resultText} = this.matchAtStart(text, ['subst', 'safesubst']);
        return {subst: matchedWord, text: resultText};
    }


    /**
     * Match some text, without parameter capture
     * Returns the magic word name, or false if there was no capture
     *
     * @param String $text
     * @return String|Boolean False on failure
     */
    matchStartToEnd(text) {
        let v = this.variables.find(v => v.synonymsRE.test(text));
        return v ? v.id : false;
    }


    /**
     * Return value of a magic variable (like PAGENAME)
     *
     * @param String index Magic variable identifier as mapped in MagicWordFactory::$mVariableIDs
     * @param bool|PPFrame $frame
     *
     * @throws MWException
     * @return string
     */
    expandMagicVariable(index, frame=false) {
        let out = '';
        const now = new Date();
        const lang = this.parser.parserConfig.language;
        const title = Title.newFromText(this.parser.parserConfig.pageTitle);
        switch(index) {
            case '!':
                out = '|';
                break;

            case 'localmonth':
            case 'currentmonth':
            case 'revisionmonth':
                out = now.toLocaleDateString(lang, {month: '2-digit'}); // i.e. '01'
                break;

            case 'localmonth1':
            case 'currentmonth1':
            case 'revisionmonth1':
                out = now.toLocaleDateString(lang, {month: 'numeric'}); // i.e. '1'
                break;

            case 'currentmonthname':
            case 'localmonthname':
                out = now.toLocaleDateString(lang, {month: 'long'}); // i.e. 'February'
                break;

            case 'currentmonthnamegen':
            case 'localmonthnamegen':
                out = now.toLocaleDateString(lang, {month: 'long'}); // i.e. 'February'
                // TODO more languages
                break;

            case 'currentmonthabbrev':
            case 'localmonthabbrev':
                out = now.toLocaleDateString(lang, {month: 'short'}); // i.e. 'Feb'
                break;

            case 'currentday':
            case 'localday':
            case 'revisionday':
                out = now.toLocaleDateString(lang, {day: 'numeric'}); // i.e. '2'
                break;

            case 'currentday2':
            case 'localday2':
            case 'revisionday2':
                out = now.toLocaleDateString(lang, {day: '2-digit'}); // i.e. '02'
                break;

            case 'currentdayname':
            case 'localdayname':
                out = now.toLocaleDateString(lang, {weekday: 'long'}); // i.e. 'Saturday'
                break;

            case 'currentyear':
            case 'localyear':
            case 'revisionyear':
                out = now.toLocaleDateString(lang, {year: 'numeric'}); // i.e. '2020'
                break;

            case 'currenttime':
            case 'localtime':
                out = now.toLocaleTimeString(lang, {hour: '2-digit', minute: '2-digit', hour12: false}); // i.e. '19:01'
                break;

            case 'currenthour':
            case 'localhour':
                out = now.toLocaleTimeString(lang, {hour: '2-digit', hour12: false}); // i.e. 01
                break;

            case 'currentweek':
            case 'localweek':
                const onejan = new Date(now.getFullYear(), 0, 1); // ie 1
                const millisecsInDay = 86400000;
                out =  String(Math.ceil((((now - onejan) / millisecsInDay) + onejan.getDay() + 1) / 7));
                break;

            case 'currentdow':
            case 'localdow':
                out = String(now.getDay()); // i.e. 6
                break;

            case 'currenttimestamp':
            case 'localtimestamp':
            case 'revisiontimestamp':
                out = now.toLocaleDateString(lang, {year: 'numeric'})
                    + now.toLocaleDateString(lang, {month: '2-digit'})
                    + now.toLocaleDateString(lang, {day: '2-digit'})
                    + now.toLocaleTimeString(lang, {hour: '2-digit', hour12: false})
                    + now.toLocaleTimeString(lang, {minute: '2-digit'})
                    + now.toLocaleTimeString(lang, {second: '2-digit'}); //YYYYMMDDHHmmss
                break;

            case 'pagename':
            case 'rootpagename':
                out = Sanitizer.escapeWikiText(title.getText());
                break;

            case 'pagenamee':
            case 'rootpagenamee':
                out = Sanitizer.escapeWikiText(title.getPartialURL());
                break;

            case 'fullpagename':
            case 'subjectpagename':
                out = Sanitizer.escapeWikiText(title.getPrefixedText());
                break;

            case 'fullpagenamee':
            case 'subjectpagenamee':
                out = Sanitizer.escapeWikiText(title.getPrefixedText(false, /* forUrl */ true));
                break;

            case 'namespace':
            case 'subjectspace':
                out = title.getNsText() === false? '' : title.getNsText();
                break;

            case 'namespacee':
            case 'subjectspacee':
                out = encodeURIComponent(title.getNsText() === false? '' : title.getNsText());
                break;

             case 'namespacenumber':
                out = String(title.getNamespace());
                break;

            case 'subpagename':
                out = Sanitizer.escapeWikiText(title.getSubpageText());
                break;

            case 'subpagenamee':
                out = encodeURIComponent(Sanitizer.escapeWikiText(title.getSubpageText()));
                break;

            case 'basepagename':
                out = Sanitizer.escapeWikiText(title.getBaseText());
                break;

            case 'basepagenamee':
                out = encodeURIComponent(Sanitizer.escapeWikiText(title.getBaseText().replace(/ /g, '_')));
                break;

            case 'talkpagename':
            case 'talkpagenamee':
            case 'pageid':
            case 'revisionid':
            case 'revisionuser':
            case 'revisionsize':
            case 'talkspace':
            case 'talkspacee':
                out = '';
                break;

            case 'currentversion':
                out = '1.34';
                break;

            case 'numberofarticles':
            case 'numberoffiles':
            case 'numberofusers':
            case 'numberofactiveusers':
            case 'numberofpages':
            case 'numberofadmins':
            case 'numberofedits':
                out = '0';
                break;

            case 'articlepath':
                out = this.parser.parserConfig.articlePath;
                break;

            case 'sitename':
                out = 'MediaWiki';
                break;

            case 'servername':
            case 'server':
                out = this.parser.parserConfig.server;
                break;

            case 'scriptpath':
            case 'stylepath':
                out = '';
                break;

            case 'directionmark':
                out = this.parser.parserConfig.isRightAlignedLanguage ? '&rlm;' : '&lrm;';
                break;

            case 'contentlanguage':
            case 'pagelanguage':
                out = this.parser.parserConfig.language;
                break;

            case 'cascadingsources':
                out = ''; // not implemented
                break;
        }

        out = this.parser.parserConfig.changeMagicVariableOutput(index, out);
        return out;
    }
};
