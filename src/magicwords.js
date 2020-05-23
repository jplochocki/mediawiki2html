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


import { Sanitizer } from './sanitizer.js';
import { Title } from './title.js';


export class MagicWords {
    constructor(parser) {
        this.parser = parser;

        this.variables = [
            '!', 'currentmonth', 'currentmonth1', 'currentmonthname',
            'currentmonthnamegen', 'currentmonthabbrev', 'currentday',
            'currentday2', 'currentdayname', 'currentyear', 'currenttime',
            'currenthour', 'localmonth', 'localmonth1', 'localmonthname',
            'localmonthnamegen', 'localmonthabbrev', 'localday', 'localday2',
            'localdayname', 'localyear', 'localtime', 'localhour',
            'numberofarticles', 'numberoffiles', 'numberofedits',
            'articlepath', 'pageid', 'sitename', 'server', 'servername',
            'scriptpath', 'stylepath', 'pagename', 'pagenamee', 'fullpagename',
            'fullpagenamee', 'namespace', 'namespacee', 'namespacenumber',
            'currentweek', 'currentdow', 'localweek', 'localdow', 'revisionid',
            'revisionday', 'revisionday2', 'revisionmonth', 'revisionmonth1',
            'revisionyear', 'revisiontimestamp', 'revisionuser',
            'revisionsize', 'subpagename', 'subpagenamee', 'talkspace',
            'talkspacee', 'subjectspace', 'subjectspacee', 'talkpagename',
            'talkpagenamee', 'subjectpagename', 'subjectpagenamee',
            'numberofusers', 'numberofactiveusers', 'numberofpages',
            'currentversion', 'rootpagename', 'rootpagenamee', 'basepagename',
            'basepagenamee', 'currenttimestamp', 'localtimestamp',
            'directionmark',  'contentlanguage',  'pagelanguage',
            'numberofadmins', 'cascadingsources',
        ].map(mwId => {
            let mw = this.parser.contentLanguage.getMagicWordDefinition(mwId);
            if(!mw)
                return false;

            let {synonyms, caseSensitive} = mw;
            return {
                id: mwId,
                synonyms,
                caseSensitive,
                synonymsRE: new RegExp('^(' + synonyms.join('|') + ')$', caseSensitive? '' : 'i')
            };
        }).filter(Boolean);

        this.variables = [...this.variables, ...this.parser.parserConfig.registerNewMagicVariables()];

        this.doubleUnderscores = [
            'notoc', 'nogallery', 'forcetoc', 'toc', 'noeditsection',
            'newsectionlink', 'nonewsectionlink', 'notitleconvert',
            'nocontentconvert', 'hiddencat', 'expectunusedcategory',
            'index', 'noindex', 'staticredirect',
        ].map(mwId => {
            let mw = this.parser.contentLanguage.getMagicWordDefinition(mwId);
            if(!mw)
                return false;

            let {synonyms, caseSensitive} = mw;
            return {
                id: mwId,
                synonyms,
                caseSensitive,
                synonymsRE: new RegExp('(' + synonyms.join('|') + ')', caseSensitive? 'g' : 'gi')
            };
        }).filter(Boolean);

        this.substIDs = [
            'subst',
            'safesubst',
        ];

        this.imageMagicWords = Object.fromEntries([
            'img_thumbnail', 'img_manualthumb', 'img_right', 'img_left',
            'img_none', 'img_width', 'img_center', 'img_framed',
            'img_frameless', 'img_lang', 'img_page', 'img_upright',
            'img_border', 'img_baseline', 'img_sub', 'img_super', 'img_top',
            'img_text_top', 'img_middle', 'img_bottom', 'img_text_bottom',
            'img_link', 'img_alt', 'img_class',
        ].map(mwId => {
            let mw = this.parser.contentLanguage.getMagicWordDefinition(mwId);
            if(mw)
                return [mwId, mw.synonyms];
            return false;
        }).filter(Boolean));
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
        const title = Title.newFromText(this.parser.parserConfig.pageTitle, this.parser.parserConfig);
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
                out = new URL(title.getFullURL(null, 'https://')).pathname;
                break;

            case 'sitename':
                out = 'MediaWiki';
                break;

            case 'servername':
            case 'server':
                out = new URL(title.getFullURL(null, 'https://')).host;
                break;

            case 'scriptpath':
            case 'stylepath':
                out = '';
                break;

            case 'directionmark':
                out = this.parser.contentLanguage.isRightAlignedLanguage ? '&rlm;' : '&lrm;';
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
