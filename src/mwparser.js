/**
 * MediaWiki parser and converter.
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


const isNodeEnv = typeof module === 'object' && module.exports;
if(isNodeEnv && typeof he == 'undefined') // node tests
    var he_lib = require('he');
else
    var he_lib = he;


import { DefaultConfig } from './defaultconfig.js';
import { Frame } from './frame.js';
import { MagicWords } from './magicwords.js';
import { Preprocessor } from './preprocessor.js';
import { Sanitizer } from './sanitizer.js';
import { Title } from './title.js';
import { StringUtils } from './utils.js';
import { calcThumbnailSize } from './utils.js';
import { ImageGalleryBase } from './imagegallery.js';



/**
 * Base class for MediaWiki parser.
 *
 * @class MWParser
 */
export class MWParser {
    constructor(config=null) {
        this.parserConfig = new DefaultConfig(config);
        this.preprocessor = new Preprocessor(this);
        this.magicwords = new MagicWords(this);

        this.pageTitle = Title.newFromText(this.parserConfig.pageTitle, this.parserConfig);
        this.interwikiLinks = [];
        this.internalLinks = [];
        this.externalLinks = [];
        this.categories = [];
        this.headings = []; // {title, level}

        this.externalLinksAutoNumber = 0;

        this.functionTagHooks = {};

        this.showToc = false;
        this.forceTocPosition = false;
        this.doubleUnderscores = [];
        this.noGallery = false;

        // constants
        this.PARSER_MARKER_PREFIX = '\x7f\'"`PARSER-UNIQ-';
        this.PARSER_MARKER_SUFFIX = '-QINU-RESRAP`"\'\x7f';

        // built-in tag hooks
        this.setFunctionTagHook('gallery', this.renderImageGallery.bind(this));
    }


    parse(text) {
        let frame = new Frame(this);
        return this.internalParse(text, frame);
    }


    internalParse(text, frame, lineStart=true) {
        let dom = this.preprocessor.preprocessToObj(text, /* forInclusion */ frame.depth != 0)
        text = frame.expand(dom);

        text = Sanitizer.removeHTMLtags(text, this.attributeStripCallback.bind(this),
            [false,],
            [],
            []
        );

        text = this.handleTables(text);
        text = text.replace(/(^|\r?\n)-----*/gm, '$1<hr>');

        text = this.handleDoubleUnderscore(text);
        text = this.handleHeadings(text);
        text = this.handleInternalLinks(text);
        text = this.handleAllQuotes(text);
        text = this.handleExternalLinks(text);
        text = this.handleBlockLevels(text, lineStart);
        text = this.finalizeHeadings(text);

        text = Sanitizer.unarmorHtmlAndLinks(text);

        return text;
    }


    /**
     * Callback from the Sanitizer for expanding items found in HTML attribute
     * values, so they can be safely tested and escaped.
     *
     * @param string &$text
     * @param bool|PPFrame $frame
     * @return string
     */
    attributeStripCallback(text, frame = false) {
        //$text = $this->replaceVariables( $text, $frame );
        //$text = $this->mStripState->unstripBoth( $text );
        return text;
    }


    /**
     * Parse the wiki syntax used to render tables.
     *
     * @param string $text
     * @return string
     */
    handleTables(text) {
        let out = '';
        const td_history = []; // Is currently a td tag open?
        const last_tag_history = []; // Save history of last lag activated (td, th or caption)
        const tr_history = []; // Is currently a tr tag open?
        const tr_attributes = []; // history of tr attributes
        const has_opened_tr = []; // Did this table open a <tr> element?
        let indent_level = 0; // table indent level

        text.split(/\r?\n/).forEach(outLine => {
            let line = outLine.trim();

            // add empty lines
            if(line == '') {
                out += outLine + '\n';
                return;
            }

            let first_character = line[0];
            let first_two = line.substr(0, 2);
            let matches = /^(:*)\s*\{\|(.*)$/.exec(line);  // matches = ['::{|class="wikitable" style="width: 100%;"', '::', 'class="wikitable" style="width: 100%;"']

            if(matches) { // is this start of new table?
                indent_level = matches[1].length;

                let attributes = Sanitizer.fixTagAttributes(matches[2], 'table');
                attributes = attributes == '' ? '' : ' ' + attributes;

                outLine = '<dl><dd>'.repeat(indent_level) + `<table${ attributes }>`;

                td_history.push(false);
                last_tag_history.push('');
                tr_history.push(false);
                tr_attributes.push('')
                has_opened_tr.push(false);
            }
            else if(td_history.length == 0) { // outside of td - do nothing
                out += outLine + '\n';
                return;
            }
            else if(first_two == '|}') { // table end
                line = '</table>' + line.substr(2);
                const last_tag = last_tag_history.pop();

                if(!has_opened_tr.pop())
                    line = '<tr><td></td></tr>' + line;

                if(tr_history.pop())
                    line = '</tr>' + line;

                if(td_history.pop())
                    line = `</${ last_tag }>${ line }`;

                tr_attributes.pop();

                if(indent_level > 0)
                    outLine = line.trimRight() + '</dd></dl>'.repeat(indent_level);
                else
                    outLine = line;
            }
            else if (first_two === '|-') { // table row
                line = line.replace(/^\|-/, '');

                // Whats after the tag is now only attributes
                let attributes = Sanitizer.fixTagAttributes(line, 'tr');
                tr_attributes.pop();
                tr_attributes.push(attributes);

                line = '';
                const last_tag = last_tag_history.pop();
                has_opened_tr.pop();
                has_opened_tr.push(true);

                if(tr_history.pop())
                    line = '</tr>';

                if(td_history.pop())
                    line = `</${ last_tag }>${ line }`;

                outLine = line;
                tr_history.push(false);
                td_history.push(false);
                last_tag_history.push('');
            }
            else if(first_character == '|' || first_character == '!' || first_two == '|+') { // td, th or caption
                if(first_two == '|+' ) {
                    first_character = '+';
                    line = line.substr(2);
                }
                else
                    line = line.substr(1);

                // Implies both are valid for table headings.
                if(first_character == '!')
                    line = StringUtils.replaceMarkup('!!', '||', line);

                outLine = '';

                line.split('||').forEach(cell => {
                    let previous = '';
                    if(first_character != '+') {
                        let tr_after = tr_attributes.pop();
                        tr_after = tr_after == '' ? '' : ' ' + tr_after;
                        if(!tr_history.pop())
                            previous = `<tr${ tr_after }>\n`;

                        tr_history.push(true);
                        tr_attributes.push('');
                        has_opened_tr.pop();
                        has_opened_tr.push(true);
                    }

                    let last_tag = last_tag_history.pop();

                    if(td_history.pop())
                        previous = `</${ last_tag }>\n${ previous }`;

                    if(tr_history.length == 1 && tr_history[0] && first_character == '+') { // close last tr before caption
                        previous += '</tr>';
                        tr_history.pop();
                    }

                    if(first_character == '|')
                        last_tag = 'td';
                    else if(first_character == '!')
                        last_tag = 'th';
                    else if(first_character == '+')
                        last_tag = 'caption';
                    else
                        last_tag = '';

                    last_tag_history.push(last_tag);

                    // A cell could contain both parameters and data
                    let cell_data = cell.split('|', 2);

                    // T2553: Note that a '|' inside an invalid link should not
                    // be mistaken as delimiting cell parameters
                    // Bug T153140: Neither should language converter markup.
                    if(/\[\[|-\{/.test(cell_data[0]))
                        cell = `${ previous }<${ last_tag }>${ cell.trim() }`;
                    else if(cell_data.length == 1)
                        cell = `${ previous }<${ last_tag }>${ cell_data[0].trim() }`;
                    else {
                        let attributes = Sanitizer.fixTagAttributes(cell_data[0], last_tag);
                        cell = `${ previous }<${ last_tag } ${ attributes }>${ cell_data[1].trim() }`;
                    }

                    outLine += cell;
                    td_history.push(true);
                });
            }

            out += outLine + '\n';
        });


        // Closing open td, tr && table
        while(td_history.length > 0 ) {
            if(td_history.pop())
                out += '</td>\n';

            if(tr_history.pop())
                out += '</tr>\n';

            if(has_opened_tr.pop())
                out += '<tr><td></td></tr>\n';

            out += '</table>\n';
        }

        // Remove trailing line-ending (b/c)
        if(out.substr(-1) == '\n')
            out = out.substr(0, out.length -1);

        // special case: don't return empty table
        if(/^\s*<table>\s*<tr>\s*<td>\s*<\/td>\s*<\/tr>\s*<\/table>\s*$/.test(out))
            return '';

        return out;
    }


    /**
     * Process [[ ]] wikilinks (rewritten handleInternalLinks2)
     *
     * @param String text
     * @return
     */
    handleInternalLinks(text) {
        const tc = Title.legalChars() + '#%'; // the % is needed to support urlencoded titles as well
        const e1 = new RegExp(`^([${ tc }]+)(?:\\|((?:.|\\n)+?))?]]((?:.|\\n)*)$`, ''); // Match a link having the form [[namespace:link|alternate]]trail
        const e1_img = new RegExp(`^([${ tc }]+)\\|((?:.|\\n)*)$`, ''); // Match cases where there is no "]]", which might still be images

        // split the entire text string on occurrences of [[
        const bits = text.split('[[');
        let out = bits.shift(); // first bit don't have [[

        // prefix
        let prefix = '', first_prefix = false;
        if(this.parserConfig.useLinkPrefixExtension) {
            // Match the end of a line for a word that's not followed by whitespace,
            // e.g. in the case of 'The Arab al[[Razi]]', 'al' will be matched
            // FIXME more languages
            let m = /((?:.|\n)*)((?:\b|^)[a-z1-9]+)$/iu.exec(out);
            if(m)
                first_prefix = m[2];
        }

        // Loop for each link
        let skipBitsToIndex = false;
        bits.forEach((bit, bitIdx) => {
            if(skipBitsToIndex) { // skip bits eaten by finding broken image
                if(skipBitsToIndex <= bitIdx)
                    skipBitsToIndex = false;
                return;
            }

            // prefix - cd.
            if(this.parserConfig.useLinkPrefixExtension) {
                let m = /((?:.|\n)*)((?:\b|^)[a-z1-9]+)$/iu.exec(out)
                if(m) {
                    out = m[1];
                    prefix = m[2];
                }
                else
                    prefix = '';

                // first link
                if(first_prefix) {
                    prefix = first_prefix;
                    first_prefix = false;
                }
            }


            let might_be_img = false;
            let m = null;
            let txt = null, trail = null;
            if((m = e1.exec(bit))) { // page with normal text or alt
                txt = m[2];
                // If we get a ] at the beginning of $m[3] that means we have a link that's something like:
                // [[Image:Foo.jpg|[http://example.com desc]]] <- having three ] in a row fucks up,
                // the real problem is with the $e1 regex
                // See T1500.
                // Still some problems for cases where the ] is meant to be outside punctuation,
                // and no image is in sight. See T4095.
                if(txt != '' && m[3][0] == ']' && txt.indexOf('[') != -1) {
                    txt += ']'; // so that handleExternalLinks($text) works later
                    m[3] = m[3].substr(1);
                }

                trail = m[3];
            }
            else if((m = e1_img.exec(bit))) { // Invalid, but might be an image with a link in its caption
                might_be_img = true;
                txt = m[2];
                trail = '';
            }
            else { // Invalid form; output directly
                out +=  prefix + '[[' + bit;
                return;
            }

            // fix up urlencoded title texts
            if(m[1].indexOf('%') != -1)
                // Should anchors '#' also be rejected?
                m[1] = encodeURIComponent(m[1].replace(/</g, '&lt;').replace(/>/g, '&gt;'));

            let origLink = m[1].replace(/^[ ]*/, '');

            // Don't allow internal links to pages containing
            // PROTO: where PROTO is a valid URL protocol; these
            // should be external links.
            if(new RegExp('^(?:' + Sanitizer.protocolSchemes() + ')').test(origLink)) {
                out +=  prefix + '[[' + bit;
                return;
            }

            let link = origLink;
            let nt = Title.newFromText(link, this.parserConfig);
            if(!nt) {
                out +=  prefix + '[[' + bit;
                return;
            }

            let ns = nt.getNamespace();
            let iw = nt.getInterwiki();

            const noforce = origLink.substr(0, 1) != ':';

            if(might_be_img) { // if this is actually an invalid link
                let found = false;
                if(ns == Title.NS_FILE && noforce) { // but might be an image
                    let i = 1;
                    while(true) {
                        // look at the next 'line' to see if we can close it there
                        let next_line = bits[bitIdx + i];
                        i++;
                        if(!next_line)
                            break;

                        m = next_line.split(']]', 3);
                        if(m.join(']]').length < next_line.length) { // explode with limit in js
                            let a = m.slice(0, 2).join(']]').length;
                            m[2] = next_line.substr(a + 2);
                        }

                        if(m.length == 3) {
                            // the first ]] closes the inner link, the second the image
                            found = true;
                            txt += `[[${ m[0] }]]${ m[1] }`;
                            trail = m[2];
                            break;
                        }
                        else if(m.length == 2)
                            // if there's exactly one ]] that's fine, we'll keep looking
                            txt += `[[${ m[0] }]]${ m[1] }`;
                        else {
                            // if $next_line is invalid too, we need look no further
                            txt += '[[' + next_line;
                            break;
                        }
                    }
                    if(!found) {
                        // we couldn't find the end of this imageLink, so output it raw
                        // but don't ignore what might be perfectly normal links in the text we've examined
                        txt = this.handleInternalLinks(txt);
                        out += `${ prefix }[[${ link }|${ txt }`;
                        skipBitsToIndex = bitIdx + i - 1;
                        // note: no $trail, because without an end, there *is* no trail
                        return;
                    }
                }
                else {
                    //it's not an image, so output it raw
                    out += `${ prefix }[[${ link }|${ txt }`;
                    // note: no $trail, because without an end, there *is* no trail
                    return;
                }
            }

            const wasblank = !txt;
            if(wasblank) {
                txt = link;
                if(!noforce)
                    // Strip off leading ':'
                    txt = txt.substr(1);
            }
            else {
                // T6598 madness. Handle the quotes only if they come from the alternate part
                // [[Lista d''e paise d''o munno]] -> <a href="...">Lista d''e paise d''o munno</a>
                // [[Criticism of Harry Potter|Criticism of ''Harry Potter'']]
                //    -> <a href="Criticism of Harry Potter">Criticism of <i>Harry Potter</i></a>
                txt = this.doQuotes(txt);
            }

            // # Link not escaped by : , create the various objects
            if(noforce) {
                if(ns == Title.NS_FILE) {
                    if(wasblank)
                        // if no parameters were passed, txt
                        // becomes something like "File:Foo.png",
                        // which we don't want to pass on to the
                        // image generator
                        txt = '';
                    else {
                        // recursively parse links inside the image caption
                        // actually, this will parse them in any other parameters, too,
                        // but it might be hard to fix that, and it doesn't matter ATM
                        txt = this.handleExternalLinks(txt);
                        txt = this.handleInternalLinks(txt);
                    }
                    // cloak any absolute URLs inside the image markup, so handleExternalLinks() won't touch them
                    // $this->armorLinksPrivate(
                    out += prefix + this.makeImage(nt, txt) + trail;
                    return;
                }
                else if(ns == Title.NS_CATEGORY) {
                    // Strip the whitespace Category links produce, see T2087, T87753
                    out = (out + prefix).trimRight() + trail;

                    let sortkey = wasblank? '' : txt;
                    sortkey = he_lib.decode(sortkey).replace(/\n/g, '');
                    // convertCategoryKey() -- skipped
                    this.categories.push({
                        title: nt,
                        sortkey
                    });
                    return;
                }
            }

            // Self-link checking
            if(ns != Title.NS_SPECIAL && this.mTitle && nt.equals(this.mTitle) && !nt.hasFragment()) {
                out +=  Parser.makeSelfLinkObj(nt, txt, '', trail, prefix);
                return;
            }

            // NS_MEDIA is a pseudo-namespace for linking directly to a file
            if(ns == Title.NS_MEDIA) {
                const cls = nt.exists() ? 'internal' : 'new';
                const url = cls == 'new' ? nt.getImageUploadUrl() : nt.getImageUrl();

                out += `${ prefix }<a href="${ url }" class="${ cls }" title="${ nt.getText() }">${ txt }</a>${ trail }`;
                return;
            }

            // add link to output
            out += this.makeLinkObj(nt, txt, null, trail, prefix);
            if(nt.isExternal())
                this.interwikiLinks.push(nt);
            else
                this.internalLinks.push(nt);
        });

        return out;
    }


    /**
     * Make appropriate markup for a link to the current article. This is since
     * MediaWiki 1.29.0 rendered as an <a> tag without an href and with a class
     * showing the link text.
     *
     * Linker::makeSelfLinkObj() rewritten
     *
     *
     * @param Title nt
     * @param String [html]
     * @param String [query]
     * @param String [trail]
     * @param String [prefix]
     * @return string
     */
    static makeSelfLinkObj(nt, html='', query='', trail='', prefix='') {
        if(!html)
            html = he_lib.encode(nt.getPrefixedText());

        let inside = '';
        [inside, trail] = this.splitTrail(trail);
        return `<a class="mw-selflink selflink">${ prefix }${ html }${ inside }</a>${ trail }`;
    }


    /**
     * Split a link trail, return the "inside" portion and the remainder of the trail
     * as a two-element array
     *
     * @param String trail
     * @return Array
     */
    splitTrail(trail) {
        let inside = /^([a-z]+)(.*)$/gu.exec(trail); // FIXME more languages
        if(inside)
            [,inside, trail] = inside;
        else
            inside = '';

        return [inside, trail];
    }


    /**
     * Make link text (without link placeholder stage)
     *
     * @param Title nt
     * @param String [html='']
     * @param URLSearchParams|String|Array|Object [query='']
     * @param String [trail='']
     * @param String [prefix='']
     * @param Boolean|Null [exists=null] page exists (null = use
     *     Title.exists() to check that)
     * @return String
     */
    makeLinkObj(nt, html='', query='', trail='', prefix='', exists=null) {
        if(!(query instanceof URLSearchParams))
            query = new URLSearchParams(query ? query : '');

        let classes = '';
        exists = exists !== null? exists : nt.exists();
        if(!exists || nt.getNamespace() == Title.NS_SPECIAL) {
            classes = 'new';
            query.append('action', 'edit');
            query.append('redlink', '1');
        }

        if(!html)
            html = he_lib.encode(nt.getPrefixedText(), {useNamedReferences: true});

        let attrs = {
            title: he_lib.encode(nt.getPrefixedText(), {useNamedReferences: true}),
            href: nt.getFullURL(query, '//', /* skipFragment */ classes == 'new') // don't include fragment for broken links
        };
        if(classes)
            attrs['class'] = classes;
        if(classes == 'new')
            attrs.title += ' (page does not exist)'; // FIXME: more languages

        attrs = Object.entries(attrs).reduce((txt, [name, value]) => {
            name = (txt.length > 0 ? ' ' : '') + name;
            if(typeof value == 'boolean')
                return value ? txt + name : txt;
            return txt + name + '="' + value + '"';
        }, '');

        let [inside, trail2] = this.splitTrail(trail);
        return `<a ${ attrs }>${ prefix }${ html }${ inside }</a>${ trail2 }`;
    }


    /**
     * Parse image options text and use it to make an image
     *
     * @param Title title
     * @param String options
     * @return String HTML
     */
    makeImage(title, options) {
        // Check if the options text is of the form "options|alt text"
        // Options are:
        //  * thumbnail  make a thumbnail with enlarge-icon and caption, alignment depends on lang
        //  * left       no resizing, just left align. label is used for alt= only
        //  * right      same, but right aligned
        //  * none       same, but not aligned
        //  * ___px      scale to ___ pixels width, no aligning. e.g. use in taxobox
        //  * center     center the image
        //  * frame      Keep original image size, no magnify-button.
        //  * framed     Same as "frame"
        //  * frameless  like 'thumb' but without a frame. Keeps user preferences for width
        //  * upright    reduce width for upright images, rounded to full __0 px
        //  * border     draw a 1px border around the image
        //  * alt        Text for HTML alt attribute (defaults to empty)
        //  * class      Set a class for img node
        //  * link       Set the target of the image link. Can be external, interwiki, or local
        // vertical-align values (no % or length right now):
        //  * baseline
        //  * sub
        //  * super
        //  * top
        //  * text-top
        //  * middle
        //  * bottom
        //  * text-bottom

        if(!this.parserConfig.titleExists(title)) {
            // TODO $this->addTrackingCategory( 'broken-file-category' );
        }

        // Process the input parameters
        let caption = '';
        let params = {
            frame: {
                align: '',
                alt: '',
                title: '',
                'class': ''
            },
            handler: {},
            horizAlign: [],
            vertAlign: []
        };
        let seenformat = false;

        options.split('|').forEach(part => {
            part = part.trim();
            let { magicName=false, value=false } = this.matchImageVariable(part);
            if(!magicName) {
                caption = part.replace(/\s+/g, ' ');
                return;
            }

            // Special case: width and height come in one variable together
            if(magicName == 'img_width') {
                let m = /^([0-9]*)x([0-9]*)\s*(?:px)?\s*$/.exec(value);
                if(m) { // width and height or height
                    if(m[1])
                        params.handler['width'] = parseInt(m[1], 10);
                    params.handler['height'] = parseInt(m[2], 10);
                }
                else { // width only
                    m = /^([0-9]*)\s*(?:px)?\s*$/.exec(value);
                    if(m)
                        params.handler['width'] = parseInt(m[1], 10);
                }
                return;
            }

            let type = '', paramName = magicName.replace(/^img_/, '').replace(/_/g, '-');
            let validated = (value === false || !isNaN(parseInt(value.trim(), 10)));
            switch(magicName) {
                case 'img_manualthumb':
                case 'img_alt':
                case 'img_class':
                    //@todo FIXME: Possibly check validity here for
                    // manualthumb? downstream behavior seems odd with
                    // missing manual thumbs.
                    validated = true;
                    type = 'frame';
                    value = this.stripAltTextPrivate(value);
                    break;

                case 'img_link':
                    type = 'frame';
                    ({type: paramName, value} = this.parseLinkParameterPrivate(this.stripAltTextPrivate(value)));

                    validated = false;
                    if(paramName) {
                        validated = true;
                        if(paramName == 'no-link')
                            value = true;
                        params[type]['link-target'] = this.parserConfig.externalLinkTarget;
                    }
                    break;

                case 'img_frameless':
                case 'img_framed':
                case 'img_thumbnail':
                    // use first appearing option, discard others.
                    validated = !seenformat;
                    seenformat = true;
                    type = 'frame';
                    break;

                case 'img_left':
                case 'img_right':
                case 'img_center':
                case 'img_none':
                    type = 'horizAlign';
                    break;

                case 'img_baseline':
                case 'img_sub':
                case 'img_super':
                case 'img_top':
                case 'img_text_top':
                case 'img_middle':
                case 'img_bottom':
                case 'img_text_bottom':
                    type = 'vertAlign';
                    break;

                case 'img_upright':
                case 'img_border':
                    type = 'frame';
                    break;

                case 'img_lang':
                case 'img_page':
                    type = 'handler';
                    break;
            }

            if(validated) {
                if(Array.isArray(params[type])) // horizAlign and vertAlign are Arrays
                    params[type].push(paramName);
                else
                    params[type][paramName] = value;
            }
            else
                caption = part.replace(/\s+/g, ' ');
        });

        // Process alignment parameters
        if(params.horizAlign.length)
            params.frame.align = params.horizAlign.shift();

        if(params.vertAlign.length)
            params.frame.valign = params.vertAlign.shift();

        params.frame.caption = caption;

        // Will the image be presented in a frame, with the caption below?
        const imageIsFramed = ('frame' in params) && (
            'frame' in params.frame
            || 'framed' in params.frame
            || 'thumbnail' in params.frame
            || 'manualthumb' in params.frame
        );

        // In the old days, [[Image:Foo|text...]] would set alt text.  Later it
        // came to also set the caption, ordinary text after the image -- which
        // makes no sense, because that just repeats the text multiple times in
        // screen readers.
        if(imageIsFramed) { // Framed image
            if(caption == '' && params.frame.alt == '')
                // No caption or alt text, add the filename as the alt text so
                // that screen readers at least get some description of the image
                params.frame.alt = title.getText();

            // Do not set $params['frame']['title'] because tooltips don't make sense
            // for framed images
        }
        else { // Inline image
            if(params.frame.alt == '') {
                // No alt text, use the "caption" for the alt text
                if(caption != '')
                    params.frame.alt = this.stripAltTextPrivate(caption);
                else
                    // No caption, fall back to using the filename for the
                    // alt text
                    params.frame.alt = title.getText();
            }
            // Use the "caption" for the tooltip text
            params.frame.title = this.stripAltTextPrivate(caption);
        }

        // makeImageHTML does the rest
        return this.makeImageHTML(title, params.frame, params.handler);
    }


    /**
     * Given parameters derived from [[Image:Foo|options...]], generate the
     * HTML that that syntax inserts in the page.
     *
     * Linker::makeImageLink rewritten
     *
     *
     */
    makeImageHTML(title, frameParams, handlerParams) {
        if(!this.parserConfig.allowImageDisplay(title))
            return this.makeLinkObj(title) // FIXME should use caption as title?

        let prefix = '', postfix = '', out = '';

        const imageExists = title.exists();
        const isThumbFrame = 'thumbnail' in frameParams || 'manualthumb' in frameParams || 'framed' in frameParams;

        if(frameParams.align == 'center') { // center align
            prefix = '<div class="center">';
            postfix = '</div>';
            frameParams.align = 'none';
        }

        // width and height
        if(!('width' in handlerParams)) {
            if(isThumbFrame || 'frameless' in frameParams || !handlerParams.width) {
                // Reduce width for upright images when parameter 'upright' is used
                if('upright' in frameParams && frameParams.upright == 0)
                    frameParams.upright = this.parserConfig.thumbUpright;

                // For caching health: If width scaled down due to upright
                // parameter, round to full __0 pixel to avoid the creation of a
                // lot of odd thumbs.
                let prefWidth = 'upright' in frameParams ?
                    Math.round(this.parserConfig.defaultThumbSize * frameParams.upright / 10) * 10  // eqiv. php's round($number, -1)
                    : this.parserConfig.defaultThumbSize;

                // Use width which is smaller: real image width or user preference width
                // Unless image is scalable vector.
                if(!('height' in handlerParams) && (handlerParams.width <= 0 ||
                        prefWidth < handlerParams.width)) {
                    handlerParams.width = prefWidth;
                }
            }
        }

        // thumbnail
        let makeThumb_params = [
            title,
            handlerParams.width ? handlerParams.width : false,
            handlerParams.height ? handlerParams.height : false,
            'frameless' in frameParams
        ];

        if('manualthumb' in frameParams) { // Use manually specified thumbnail
            let nt = Title.newFromText(frameParams.manualthumb, this.parserConfig);
            if(nt.getNamespace() != Title.NS_FILE)
                nt.mNamespace = Title.NS_FILE;
            makeThumb_params[0] = nt;
        }


        if((isThumbFrame || 'frameless' in frameParams) && makeThumb_params[1] === false && makeThumb_params[2] === false) // default width for thumb, if not set
            makeThumb_params[1] = this.parserConfig.defaultThumbSize;


        if('framed' in frameParams) { // Use image dimensions, don't scale
            makeThumb_params[1] = false;
            makeThumb_params[2] = false;
        }


        const thumb = this.parserConfig.makeThumb(...makeThumb_params);
        if(thumb)
            thumb.title = makeThumb_params[0]; // if manualthumb, then thumb.title != title


        // in frame output
        // based od Linker::makeThumbLink2
        let imgParams = {
            alt: frameParams.alt
        };
        imgParams['class'] = ( frameParams['class'] ? frameParams['class'] : '' );

        if('border' in frameParams)
            imgParams['class'] += ' thumbborder'


        if(isThumbFrame) {
            // Create a thumbnail. Alignment depends on the writing direction of
            // the page content language (right-aligned for LTR languages,
            // left-aligned for RTL languages)
            // If a thumbnail width has not been provided, it is set
            // to the default user option as specified in Language*.php
            if(frameParams.align == '')
                frameParams.align = this.parserConfig.isRightAlignedLanguage ? 'left' : 'right';

            let outerWidth = ( thumb ? thumb.width : handlerParams.width ) + 2;
            if(isNaN(outerWidth) || !imageExists)
                outerWidth = 180 + 2; // Linker::makeThumbLink2 hardcoded value

            prefix += `<div class="thumb t${ frameParams.align }"><div class="thumbinner" style="width: ${ outerWidth }px;">`;
            postfix = '</div></div>' + postfix;

            let zoomIcon = '';
            if(thumb && imageExists) {
                imgParams['class'] += ' thumbimage';

                if(!('framed' in frameParams))
                    zoomIcon = `<div class="magnify"><a href="${ title.getFullURL() }" class="internal" title="Enlarge"></a></div>`;
            }

            postfix = `<div class="thumbcaption">${ zoomIcon }${ frameParams.caption }</div>${postfix}`;
        }


        if(thumb && imageExists) {
            // link to an image
            // Linker::getImageLinkMTOParams (partialy) skipped
            // ThumbnailImage::toHtml
            imgParams['class'] = imgParams['class'].trim();
            imgParams.decoding = 'async';
            imgParams.src = thumb.url;
            imgParams.width = thumb.width;
            imgParams.height = thumb.height;

            if(this.parserConfig.wgResponsiveImages) { // Linker::processResponsiveImages
                let w15 = Math.round(imgParams.width * 1.5);
                let w20 = Math.round(imgParams.width * 2);

                let h15 = Math.round(imgParams.height * 1.5);
                let h20 = Math.round(imgParams.height * 2);

                let t15 = this.parserConfig.makeThumb(thumb.title, w15, h15);
                let t20 = this.parserConfig.makeThumb(thumb.title, w20, h20);

                imgParams.srcset = '';
                if(t15 && t15.url != thumb.url)
                    imgParams.srcset += t15.url + ' 1.5x';
                if(t20 && t20.url != thumb.url && t15.url != t20.url)
                    imgParams.srcset += (imgParams.srcset == ''? '' : ', ') + t20.url + ' 2x';
            }

            if(frameParams.valign)
                imgParams.style = `vertical-align: ${ frameParams.valign }`;

            // image link params
            let linkAttrs = {
                href: title.getFullURL(),
                'class': 'image'
            };

            if(frameParams.title)
                linkAttrs.title = frameParams.title;

            if(frameParams['link-url']) {
                linkAttrs.href = frameParams['link-url'];
                delete linkAttrs['class'];
                linkAttrs.rel = 'nofollow';
            }
            else if(frameParams['link-title']) {
                linkAttrs.href = frameParams['link-title'].getFullURL();
                delete linkAttrs['class'];
                if(!linkAttrs.title)
                    linkAttrs.title = frameParams['link-title'].getPrefixedText()
            }
            else if(frameParams['file-link'])
                linkAttrs = {
                    'href': thumb.url
                };
            else if(frameParams['no-link']) {
                linkAttrs = {};
                if(frameParams.title)
                    imgParams.title = frameParams.title;
            }

            if(isThumbFrame && 'manualthumb' in frameParams)
                delete linkAttrs['class'];

            imgParams = Object.assign({}, ...Object.entries(imgParams).filter(([k, v]) => v != '').map(([k, v]) => ({[k]: v + ''})));
            if(frameParams['no-link'])
                out = `<img ${ Sanitizer.safeEncodeTagAttributes(imgParams) }>`;
            else
                out = `<a ${ Sanitizer.safeEncodeTagAttributes(linkAttrs) }><img ${ Sanitizer.safeEncodeTagAttributes(imgParams) }></a>`;
        }
        else {
            // thumb error - make a "broken" link to an image
            // Linker::makeBrokenImageLinkObj
            const label = frameParams.title ? frameParams.title : title.getPrefixedText();

            if(this.parserConfig.uploadMissingFileUrl)
                out = `<a href="${ title.getImageUploadUrl() }" class="new" title="${ title.getPrefixedText() }">${ label }</a>`;
            else {
                const cls = title.isExternal() ? 'class="extiw"' : '';
                out = `<a href="${ title.getFullURL() }" ${ cls } title="${ title.getPrefixedText() }">${ label }</a>`;
            }
        }

        if(frameParams.align != '' && !isThumbFrame) {
            prefix += `<div class="float${ frameParams.align }">`;
            postfix = '</div>' + postfix;
        }

        return (prefix + out + postfix).replace(/\n/g, ' ');
    }


    /**
     * Match magic words related to image params.
     * simplified version of MagicWordArray::matchVariableStartToEnd
     *
     * @param String txt
     * @return {magicName: String, value: String|Boolean}
     */
    matchImageVariable(txt) {
        // generate test regexes
        if(!this._imageMagicWordsRegExs)
            this._imageMagicWordsRegExs = Object.entries(this.magicwords.imageMagicWords)
                .filter(([k,]) => /^img_/.test(k))
                .map(([k, v]) =>
                    v.map(v1 => [k, new RegExp('^' + v1.replace(/\$1/g, '(.*?)') + '$')])
                ).flat();

        let m = this._imageMagicWordsRegExs.find(([, re]) => re.test(txt));
        if(!m)
            return {};

        let [magicName, re] = m;
        m = re.exec(txt);
        let value = m.length == 2 ? m[1] : false;

        return {magicName, value};
    }


    /**
     * Strip bad stuff out of the title (tooltip)
     *
     * @param String caption
     * @return String
     */
    stripAltTextPrivate(caption) {
        // skipped T209236
        caption = Sanitizer.stripAllTags(caption);
        return caption;
    }


    /**
     * Parse the value of 'link' parameter in image syntax (`[[File:Foo.jpg|link=<value>]]`).
     *
     * Adds an entry to appropriate link tables.
     *
     * @param String value
     * @return {type: String|null, value: String|Boolean}
     */
    parseLinkParameterPrivate(value) {
        const protocolsRe = new RegExp('^(' + Sanitizer.protocolSchemes().join('|') + ')', 'i');
        let type = null;
        let target = false;
        if(value == '')
            type = 'no-link';
        else if(protocolsRe.test(value)) {
            this.externalLinks.push(value);
            type = 'link-url';
            target = value;
        }
        else {
            let nt = Title.newFromText(value, this.parserConfig);
            if(nt) {
                if(nt.isExternal())
                    this.interwikiLinks.push(nt);
                else
                    this.internalLinks.push(nt);

                type = 'link-title';
                target = nt;
            }
        }
        return {type, value: target};
    }


    /**
     * Replace single quotes with HTML markup
     *
     * @param String text
     * @return String
     */
    handleAllQuotes(text) {
        return text.split(/\r?\n/).map(t => this.doQuotes(t)).join('\n');
    }


    /**
     * Helper function for handleAllQuotes
     *
     * @param String text
     * @return String
     */
    doQuotes(text) {
        let bits = text.split(/(''+)/);

        // elimination of some incorrect sequences
        let numBold = 0, numItalic = 0;
        bits = bits.map(b => {
            // treat four apostrophes as ' (one in text) + bold
            if(b == "''''") { // 4x'
                numBold++;
                return ["'", "'''"];
            }
            // If there are more than 5 apostrophes in a row, assume they're
            // all text except for the last 5.
            else if(/^'{6,}$/.test(b)) {
                numBold++;
                numItalic++;
                return [Sanitizer.escapeWikiText("'".repeat(b.length - 5)), "'''''"];
            }
            else if(b == "''") // 2x'
                numItalic++;
            else if(b == "'''") // 3x'
                numBold++;
            else if(b == "'''''") { // 5x'
                numBold++;
                numItalic++;
            }
            return b;
        }).flat();

        // If there is an odd number of both bold and italics, it is likely
        // that one of the bold ones was meant to be an apostrophe followed
        // by italics. Which one we cannot know for certain, but it is more
        // likely to be one that has a single-letter word before it.
        if((numBold % 2 == 1) && (numItalic % 2 == 1)) {
            let firstSingleLetterWord = -1, firstMultiLetterWord = -1, firstSpace = -1;

            bits.some((b, i) => {
                if(b == "'''") { // 3x'
                    const x1 = b.substr(b.length -1), x2 = b.substr(b.length -2, 1);
                    if(x1 == ' ') {
                        if(firstSpace == -1)
                            firstSpace = i;
                    }
                    else if(x2 == ' ') {
                        firstSingleLetterWord = i;
                        // if $firstsingleletterword is set, we don't
                        // look at the other options, so we can bail early.
                        return true;
                    }
                    else if(firstMultiLetterWord == -1)
                        firstMultiLetterWord = i;
                }
            });

            // If there is a single-letter word, use it!
            if(firstSingleLetterWord != -1) {
                bits[firstSingleLetterWord] = "''";
                bits[firstSingleLetterWord - 1] += "'";
            }
            else if(firstMultiLetterWord != -1) {
                // If not, but there's a multi-letter word, use that one.
                bits[firstMultiLetterWord] = "''";
                bits[firstMultiLetterWord - 1] += "'";
            }
            else if(firstSpace != -1) {
                // ... otherwise use the first one that has neither.
                // (notice that it is possible for all three to be -1 if, for example,
                // there is only one pentuple-apostrophe in the line)
                bits[firstSpace] = "''";
                bits[firstSpace - 1] += "'";
            }
        }

        // Now let's actually convert our apostrophic mush to HTML!
        let out = '', buffer = '', state = '';
        bits.forEach(b => {
            if(!/^'{2,5}$/.test(b)) {
                if(state == 'both')
                    buffer += b;
                else
                    out += b;
            }

            if(b == "''") { // 2x'
                switch(state) {
                    case 'i':
                        out += '</i>';
                        state = '';
                        break;

                    case 'bi':
                        out += '</i>';
                        state = 'b';
                        break;

                    case 'ib':
                        out += '</b></i><b>';
                        state = 'b';
                        break;

                    case 'both':
                        out += '<b><i>' + buffer + '</i>';
                        state = 'b';
                        break;

                    default:
                        out += '<i>';
                        state += 'i'; // $state can be 'b' or ''
                        break;
                }
            }
            else if(b == "'''") { // 3x'
                switch(state) {
                    case 'b':
                        out += '</b>';
                        state = '';
                        break;

                    case 'bi':
                        out += '</i></b><i>';
                        state = 'i';
                        break;
                    case 'ib':
                        out += '</b>';
                        state = 'i';
                        break;

                    case 'both':
                        out += '<i><b>' + buffer + '</b>';
                        state = 'i';
                        break;

                    default:
                        out += '<b>';
                        state += 'b'; // $state can be 'i' or ''
                        break;
                }
            }
            else if(b == "'''''") { // 5x'
                switch(state) {
                    case 'b':
                        out += '</b><i>';
                        state = 'i';
                        break;

                    case 'i':
                        out += '</i><b>';
                        state = 'b';
                        break;

                    case 'bi':
                        out += '</i></b>';
                        state = '';
                        break;

                    case 'ib':
                        out += '</b></i>';
                        state = '';
                        break;

                    case 'both':
                        out += '<i><b>' + buffer + '</b></i>';
                        state = '';
                        break;

                    default: // $state == ''
                        buffer = ''
                        state = 'both';
                        break;
                }
            }
        });

        // Now close all remaining tags.  Notice that the order is important.
        if(state == 'b' || state == 'ib')
            out += '</b>';
        if(state == 'i' || state == 'bi' || state == 'ib')
            out += '</i>';
        if(state == 'bi')
            out += '</b>';

        // There might be lonely ''''', so make sure we have a buffer
        if(state == 'both' && buffer != '') {
            out += '<b><i>' + buffer + '</i></b>';
        }

        return out;
    }


    /**
     * Replace external links
     *
     * @param String text
     * @return String
     */
    handleExternalLinks(text) {
        const spaceSeparator = '\\xA0\\u1680\\u2000-\\u200A\\u202F\\u205F\\u3000';
        const EXT_LINK_URL_CLASS = '[^\\][<>"\\x00-\\x20\\x7F' + spaceSeparator + '\uFFFD]';
        const EXT_LINK_ADDR = '(?:[0-9.]+|\\[(?:[0-9a-f:.]+)\\]|' + EXT_LINK_URL_CLASS + ')';
        const protocols = Sanitizer.protocolSchemes().join('|');

        let bits = text.split(new RegExp('\\[((' + protocols + ')' + EXT_LINK_ADDR
            + EXT_LINK_URL_CLASS + '*)[' + spaceSeparator + ']*([^\\]\\x00-\\x08\\x0a-\\x1F\\uFFFD]*?)\\]', 'ui'));


        let out = bits.shift();
        if(bits < 4)
            return text;

        bits = bits.reduce((bits, bt) => {
            let last = bits[bits.length -1];
            if(last.length >= 4)
                last = bits[bits.push([]) -1];
            last.push(bt);

            return bits;
        }, [[]]);


        bits.forEach(bit => {
            let [url, /* protocol */, text, trail] = bit;

            // The characters '<' and '>' (which were escaped by
            // removeHTMLtags()) should not be included in
            //  URLs, per RFC 2396.
            if(/&(lt|gt);/i.test(url)) {
                let a = /&(lt|gt);/gi.exec(url);
                text = url.substr(a.index) + text;
                url = url.substr(0, a.index);
            }
            text = text.trimLeft();

            // If the link text is an image URL, replace it with an <img> tag
            // This happened by accident in the original parser, but some people used it extensively
            let img = this.maybeMakeExternalImage(text);
            if(img !== false)
                text = img;

            // Set linktype for CSS
            let linktype = 'text', dtrail = '';

            // No link text, e.g. [http://domain.tld/some.link]
            if(text == '') {
                // Autonumber
                text = `[${ ++this.externalLinksAutoNumber }]`;
                linktype = 'autonumber';
            }
            else
                // Have link text, e.g. [http://domain.tld/some.link text]s
                // Check for trail
                [dtrail, trail] = this.splitTrail(trail);

            // Excluding protocol-relative URLs may avoid many false positives.
            // FIXME
            // if ( preg_match( '/^(?:' . wfUrlProtocolsWithoutProtRel() . ')/', $text ) ) {
            //  $text = $this->getTargetLanguage()->getConverter()->markNoConversion( $text );
            // }

            url = encodeURI(url);

            let isExternalServer = !(new RegExp('^(http:\\/\\/|https:\\/\\/)' + this.parserConfig.server + '\\/[^@]+').test(url));
            let rel = isExternalServer ? 'nofollow' : '';

            if(this.parserConfig.externalLinkTarget && !['_self', '_parent', '_top'].includes(this.parserConfig.externalLinkTarget))
                // T133507. New windows can navigate parent cross-origin.
                // Including noreferrer due to lacking browser
                // support of noopener. Eventually noreferrer should be removed.
                rel = (rel + ' noreferrer noopener').trim();

            let target = this.parserConfig.externalLinkTarget ? `target="${ this.parserConfig.externalLinkTarget }"` : '';

            out += `<a ${ rel != '' ? 'rel="' + rel + '" ' : '' }class="external ${ linktype }" href="${ url }"${ target != '' ? 'target="' + target + '"' : '' }>${ text }</a>${ dtrail }${ trail }`;

            // Register link in the output object.
            if(!this.externalLinks.includes(url))
                this.externalLinks.push(url);
        });

        return out;
    }


    /**
     * make an image if it's allowed, either through the global
     * option, through the exception, or through the on-wiki whitelist
     *
     * @param string url
     * @return string
     */
    maybeMakeExternalImage(url) {
        const spaceSeparator = '\\xA0\\u1680\\u2000-\\u200A\\u202F\\u205F\\u3000';
        const EXT_IMAGE_REGEX = new RegExp('^(http:\\/\\/|https:\\/\\/)((?:\\[(?:[0-9a-f:.]+)\\])?[^\\][<>"\\x00-\\x20\\x7F'
            + spaceSeparator + '\\uFFFD]+)\\/([A-Za-z0-9_.,~%\\-+&;#*?!=()@\\x80-\\xFF]+)\\.(gif|png|jpg|jpeg)$', 'ui');

        if(!(EXT_IMAGE_REGEX.test(url) && this.parserConfig.allowExternalImage(url)))
            return false;

        // Linker::makeExternalImage
        let alt = '';
        if(url.lastIndexOf('/') != -1)
            alt = url.substr(url.lastIndexOf('/') + 1);

        return `<img src="${ url }" alt="${ alt }">`;
    }


    /**
     * Get a list of strippable XML-like elements
     *
     * @return Array
     */
    getStripList() {
        return ['pre', 'nowiki', 'gallery', 'indicator', ...Object.keys(this.functionTagHooks)];
    }


    /**
     * Create a tag function, e.g. "<test>some stuff</test>".
     *
     * @param String tag
     * @param Function callback
     */
    setFunctionTagHook(tag, callback) {
        tag = tag.toLowerCase();
        let a = /[<>\r\n]/.exec(tag);
        if(a)
            throw new Error(`Invalid character ${ a[0] } in setFunctionTagHook('tag', ...) call.`);
        if(typeof callback != 'function')
            throw new Error(`Expected callable in setFunctionTagHook('tag', function) call.`);

        this.functionTagHooks[tag] = callback;
    }


    /**
     * Return the text to be used for a given extension tag.
     *
     * @param Object params Associative array of parameters
     *     tagName    tag name
     *     attributes Optional object of parsed attributes
     *     tagText    Contents of extension element
     * @param Frame frame
     * @return string
     */
    extensionSubstitution(params, frame) {
        let out = '';
        if(this.functionTagHooks[params.tagName]) {
            out = this.functionTagHooks[params.tagName](params.tagText, params.attributes, this, frame);
        } else {
            // not known tag - print out
            let attrs = Sanitizer.safeEncodeTagAttributes(attributes);
            attrs = attrs[0] == ' ' ? attrs : ' ' + attrs;
            if(params.tagText == '')
                out = `<${ params.tagName }${ attrs }/>`;
            else
                out = `<${ params.tagName }${ attrs }>${ tagText }</${ params.tagName }>`;
        }
        return out;
    }


    /**
     * Half-parse wikitext to half-parsed HTML. This recursive parser entry point
     * can be called from an extension tag hook.
     *
     * @param String tagText
     * @param Frame frame
     * @param Boolean lineStart Whether or not this is at the start of a line
     * (false = first line is continuation of existing line)
     * @return String
     */
    recursiveTagParse(tagText, frame, lineStart) {
        return this.internalParse(tagText, frame, lineStart);
    }


    /**
     * Return the text of a template, after recursively
     * replacing any variables or templates within the template.
     *
     * @param String templateName
     * @param Object templateParams
     * @param Frame frame The current frame
     * @param Object [parentTemplateArgs={}]
     * @return String The text of the template
     */
    templateSubstitution(templateName, templateParams, frame, parentTemplateArgs={}) {
        let out = '';
        let outAsWiki = false;

        // preprocess and expand templateName, if necessary
        if(/\{\{\{?/.test(templateName)) {
            let dom = this.preprocessor.preprocessToObj(templateName);
            let errorInResult = false;
            dom = dom.map(d => {
                d = frame.expand([d], parentTemplateArgs);

                if(/\{\{\{?/.test(d)) {
                    d = Sanitizer.escapeWikiText(d);
                    errorInResult = true;
                }

                if(Sanitizer.isStringArmored(d))
                    errorInResult = true;

                return d;
            });

            // if {{ }} / {{{ }}} not expanded - return template as text
            if(errorInResult) {
                out = Object.entries(templateParams).map(([k,v]) => {
                    if(/^\d+$/.test(k))
                        return v;
                    else
                        return k + '=' + v;
                }).join('|');

                if(out.length > 0)
                    out = '|' + out;

                return Sanitizer.escapeWikiText('{{') + dom.join('') + Sanitizer.escapeWikiText(out + '}}');
            }
            else
                templateName = dom.join('');
        }

        // preprocess and expand template arguments
        Object.entries({...templateParams}).forEach(([k, v]) => {
            // preprocess param name
            let newKey = this.preprocessor.preprocessToObj(k);
            newKey = frame.expand(newKey, parentTemplateArgs);

            // preprocess param value
            let newValue = this.preprocessor.preprocessToObj(v);
            newValue = frame.expand(newValue, parentTemplateArgs)

            delete templateParams[k];
            templateParams[newKey] = newValue;
        });

        // SUBST - ignored, but processed
        let found = false, subst = false;
        ({subst, text: templateName} = this.magicwords.matchSubstAtStart(templateName));
        found = subst !== false;

        // Variables
        if(!found && Object.keys(templateParams).length == 0) {
            let id = this.magicwords.matchStartToEnd(templateName);
            if(id !== false) {
                out = this.magicwords.expandMagicVariable(id, frame);
                found = true;
            }
        }

        // MSG, MSGNW and RAW
        if(!found) {
            let {matchedWord, text} = this.magicwords.matchAtStart(templateName, ['msgnw', 'msg', 'raw']);
            outAsWiki = matchedWord == 'msgnw';
            templateName = text;
            // msg + raw are ignored
        }

        // Parser functions
        if(!found && templateName.indexOf(':') != -1) {
            let [, funcName, funcArg1] = /^(.*?):\s*(.*)$/.exec(templateName);
            if(funcArg1.indexOf('=') != -1) {
                let [, argName, argValue] = /^\s*(.*?)\s*=\s*(.*?)\s*$/.exec(funcArg1);
                funcArg1 = {[argName]: argValue};
            }
            else
                funcArg1 = {'0': funcArg1};

            let result = this.callParserFunction(frame, funcName, {...funcArg1, ...templateParams});
            if(result !== false) {
                out = result;
                found = true;
            }
        }

        // template page
        if(!found || subst !== false) {
            let templateTitle = Title.newFromText(templateName, this.parserConfig);
            if(templateName.startsWith(':'))
                templateTitle = Title.newFromText(templateName.substr(1), this.parserConfig);
            else if(templateTitle.mNamespace == Title.NS_MAIN)
                templateTitle.mNamespace = Title.NS_TEMPLATE;

            // get template and preprocess it
            const tpl = this.parserConfig.getTemplate(templateTitle.getPrefixedText());
            if(tpl === false)
                return Sanitizer.armorHtmlAndLinks(this.makeLinkObj(templateTitle,
                    /* html */ templateTitle.getPrefixedText(), /* query */ '', /* trail */ '',
                    /* prefix */ '', /* exists */ false));

            if(outAsWiki)
                return Sanitizer.escapeWikiText(tpl);

            const loopDetection = frame.loopDetection(templateTitle.getPrefixedText());

            if(!loopDetection.loopDetected) {
                const tplRoot = this.preprocessor.preprocessToObj(tpl, /* forInclusion */ true);

                // replace template params
                let fr = new Frame(this, frame);
                fr.loopCheckTitles.push(templateTitle.getPrefixedText());
                out += fr.expand(tplRoot, templateParams);
            }
            else if(loopDetection.maxDeepDetected) {
                out += `<span class="error">Template recursion depth limit exceeded (${ frame.MAX_TEMPLATE_DEPTH })</span>`;
            }
            else {
                out += Sanitizer.armorHtmlAndLinks('<span class="error">Template loop detected: ' +
                    this.makeLinkObj(templateTitle, /* html */ templateTitle.getPrefixedText(),
                        /* query */ '', /* trail */ '', /* prefix */ '', /* exists */ true) + '</span>');
            }
        }

        return out;
    }


    /**
     * Triple brace replacement - used for template arguments.
     *
     * @param Object params
     * @param Frame frame
     * @param Object parentTemplateArgs
     */
    templateArgSubstitution(params, frame, parentTemplateArgs) {
        // expand param name
        let {name: paramName, defaultValue} = params;

        paramName = this.preprocessor.preprocessToObj(paramName);
        let errorInResult = false;
        paramName = paramName.map(d => {
            d = frame.expand([d], parentTemplateArgs);

            if(/\{\{\{?/.test(d)) {
                d = Sanitizer.escapeWikiText(d);
                errorInResult = true;
            }

            if(Sanitizer.isStringArmored(d))
                errorInResult = true;

            return d;
        });

        paramName = paramName.join('');

        if(errorInResult)
            return `{{{${ paramName }${ defaultValue != '' ? '|' + defaultValue : '' }}}}`;

        // find paramName in parent template args
        if(parentTemplateArgs) {
            let argName = Object.keys(parentTemplateArgs).find(name => name == paramName);
            if(argName)
                return parentTemplateArgs[argName];
        }

        // expand & use default value, if available
        if(defaultValue != '') {
            defaultValue = this.preprocessor.preprocessToObj(defaultValue);
            defaultValue = frame.expand(defaultValue, parentTemplateArgs);
            return defaultValue;
        }

        // else - show unknown param braces
        return `{{{${ paramName }${ defaultValue != '' ? '|' + defaultValue : '' }}}}`;
    }


    /**
     * Call a parser function and return result (or false, when parser function
     * is unknown).
     *
     * @param Frame frame
     * @param String funcName
     * @param Object args
     * @return Object
     */
    callParserFunction(frame, funcName, args) {
        let out = this.standardParserFunctions(funcName, args);
        if(out !== false)
            return out;

        return this.parserConfig.callParserFunction(funcName, args);
    }


    /**
     * Standard defined wiki parser functions (eg. #language)
     */
    standardParserFunctions(funcName, args) {
        // TODO: more languages
        const langCodes = {
            'en': {
                'ar': 'Arabic',
                'cs': 'Czech',
                'da': 'Danish',
                'de': 'German',
                'el': 'Modern Greek',
                'en': 'English',
                'es': 'Spanish',
                'fi': 'Finnish',
                'fr': 'French',
                'he': 'Hebrew',
                'hi': 'Hindi',
                'hu': 'Hungarian',
                'id': 'Indonesian',
                'it': 'Italian',
                'ja': 'Japanese',
                'ko': 'Korean',
                'nl': 'Dutch',
                'no': 'Norwegian',
                'pl': 'Polish',
                'pt': 'Portuguese',
                'ro': 'Romanian',
                'ru': 'Russian',
                'sk': 'Slovak',
                'sv': 'Swedish',
                'th': 'Thai',
                'tr': 'Turkish',
                'zh': 'Chinese'
            }
        };

        let out = false;

        // case insensitive names
        switch(funcName.toLowerCase()) {
            case '#language':
                let {0: code, 1: inLang='en'} = args;

                if(!langCodes[inLang])
                    inLang = 'en';

                out = '';
                if(langCodes[inLang][code])
                    out = langCodes[inLang][code];
                break;

            case '#tag':
                let {0: tagName, 1: content=''} = args;
                let htmlParams = Object.fromEntries(Object.entries(args).filter(([k, v]) => !/^\d+$/.test(k)));
                htmlParams = Sanitizer.safeEncodeTagAttributes(htmlParams);
                htmlParams = htmlParams.length > 0 ? ' ' + htmlParams : htmlParams;

                out = `<${ tagName }${ htmlParams }>${ content }</${ tagName }>`;
                break;
        }

        // case sensitive names
        let title = null;
        switch(funcName) {
            case 'PAGENAME':
            case 'ROOTPAGENAME':
                ({0: title} = args);
                title = Title.newFromText(title, this.parserConfig);
                out = '';
                if(title)
                    out = Sanitizer.escapeWikiText(title.getText());
                break;

            case 'PAGENAMEE':
            case 'ROOTPAGENAMEE':
                ({0: title} = args);
                title = Title.newFromText(title, this.parserConfig);
                out = '';
                if(title)
                    out = Sanitizer.escapeWikiText(title.getPartialURL());
                break;

            case 'FULLPAGENAME':
            case 'SUBJECTPAGENAME':
                ({0: title} = args);
                title = Title.newFromText(title, this.parserConfig);
                out = '';
                if(title)
                    out = Sanitizer.escapeWikiText(title.getPrefixedText());
                break;

            case 'FULLPAGENAMEE':
            case 'SUBJECTPAGENAME':
                ({0: title} = args);
                title = Title.newFromText(title, this.parserConfig);
                out = '';
                if(title)
                    out = Sanitizer.escapeWikiText(title.getPrefixedText(false, /* forUrl */ true));
                break;

            case 'SUBPAGENAME':
                ({0: title} = args);
                title = Title.newFromText(title, this.parserConfig);
                out = '';
                if(title)
                    out = Sanitizer.escapeWikiText(title.getSubpageText());
                break;

            case 'SUBPAGENAMEE':
                ({0: title} = args);
                title = Title.newFromText(title, this.parserConfig);
                out = '';
                if(title)
                    out = encodeURIComponent(Sanitizer.escapeWikiText(title.getSubpageText()));
                break;

            case 'BASEPAGENAME':
                ({0: title} = args);
                title = Title.newFromText(title, this.parserConfig);
                out = '';
                if(title)
                    out = Sanitizer.escapeWikiText(title.getBaseText());
                break;

            case 'BASEPAGENAMEE':
                ({0: title} = args);
                title = Title.newFromText(title, this.parserConfig);
                out = '';
                if(title)
                    out = encodeURIComponent(Sanitizer.escapeWikiText(title.getBaseText().replace(/ /g, '_')));
                break;

            case 'PAGESINCATEGORY':
            case 'PAGESINCAT':
            case 'NUMBERINGROUP':
            case 'NUMINGROUP':
            case 'PAGESINNS':
            case 'PAGESINNAMESPACE':
                out = '0';
                break;

            case 'PROTECTIONLEVEL':
            case 'PROTECTIONEXPIRY':
            case 'DISPLAYTITLE':
            case 'DEFAULTSORT':
            case 'DEFAULTSORTKEY':
            case 'DEFAULTCATEGORYSORT':
            case 'TALKPAGENAME':
            case 'TALKPAGENAMEE':
                out = '';
                break;
        }

        return out;
    }


    /**
     * Strip double-underscore items like __NOGALLERY__ and __NOTOC__
     *
     * @param String text
     * @return String
     */
    handleDoubleUnderscore(text) {
        // The position of __TOC__ needs to be recorded
        let mw = this.magicwords.doubleUnderscores.find(mw => mw.id == 'toc');
        if(mw.synonymsRE.test(text)) {
            this.showToc = true;
            this.forceTocPosition = true;

            // Set a placeholder. At the end we'll fill it in with the TOC.
            let firstOccurrence = true;
            text = text.replace(mw.synonymsRE, function(a, b, c) {
                if(firstOccurrence) {
                    firstOccurrence = false;
                    return '<!--MWTOC\'"-->';
                }
                return ''; // Only keep the first one.
            });
        }

        //Now match and remove the rest of them
        this.doubleUnderscores = [];
        this.magicwords.doubleUnderscores.forEach(mw => {
            if(mw.synonymsRE.test(text)) {
                this.doubleUnderscores.push(mw.id);
                text = text.replace(mw.synonymsRE, '');
            }
        });

        this.noGallery = this.doubleUnderscores.includes('nogallery');
        if(this.doubleUnderscores.includes('notoc') && !this.forceTocPosition)
            this.showToc = false;

        // hiddencat, noindex, index - ignored
        return text;
    }


    /**
     * Parse headers and return html
     *
     * @param String text
     * @return String
     */
    handleHeadings(text) {
        for(let i = 6; i >= 1; --i) {
            const h = '='.repeat(i);
            // Trim non-newline whitespace from headings
            // Using \s* will break for: "==\n===\n" and parse as <h2>=</h2>
            text = text.replace(new RegExp(`^(?:${ h })[ \\t]*(.+?)[ \\t]*(?:${ h })\\s*$`, 'gm'), `<h${ i }>$1</h${ i }>`)
        }
        return text;
    }


    /**
     * This function accomplishes several tasks:
     * 1) Auto-number headings if that option is enabled
     * 2) Add an [edit] link to sections for users who have enabled the option and can edit the page
     * 3) Add a Table of contents on the top for users who have enabled the option
     * 4) Auto-anchor headings
     *
     * @param String text
     * @return String
     */
    finalizeHeadings(text) {
        let showEditLink = !this.doubleUnderscores.includes('noeditsection');

        // get all headlines
        let matches = text.match(/<H([1-6])(.*?>)([\s\S]*?)<\/H[1-6] *>/gi);
        matches = !matches ? [] : matches.map(m => /<H([1-6])(.*?>)([\s\S]*?)<\/H[1-6] *>/gi.exec(m)); // 1: header level, 2: params + >, 3 header text

        // should toc be showed
        let enoughToc = this.showToc || matches.length >= 4 || this.forceTocPosition;

        // TODO __NEWSECTIONLINK__

        // if the string __FORCETOC__ (not case-sensitive) occurs in the HTML,
        // override above conditions and always show TOC above first header
        if(this.doubleUnderscores.includes('forcetoc'))
            enoughToc = true;

        // normalize headers index & html
        let headers = this.normalizeHeadersIndex(matches);
        text = this.normalizeHeadersHtml(text, headers, showEditLink);

        // TOC generation
        let toc = this.generateTOC(headers);

        if(headers.length == 0)
            enoughToc = false; // show toc only, if it has headers

        if(enoughToc && this.forceTocPosition)
            text = text.replace('<!--MWTOC\'"-->', toc);
        else if(enoughToc)
            text = toc + '\n' + text;

        return text;
    }


    /**
     * Normalize headers index (from regex matched Hx)
     *
     * @private
     */
    normalizeHeadersIndex(headersMatches) {
        // normalize title
        let headers = [];
        headersMatches.forEach(([, headLevel, headAttrs, headText]) => {
            let {tocHeaderTitle, headingsIndex, headerHint, headerAnchor} = this.normalizeHeaderTitle(headText, headers);

            headers.push({
                tocLevel: headLevel,
                text: tocHeaderTitle,
                headingsIndex,
                headerHint,
                headerAnchor
            });
        });

        // normalize levels
        let lastLevel = 0;
        headers = headers.map(hd => {
            let tocLevel = parseInt(hd.tocLevel, 10);
            if(lastLevel < tocLevel)
                tocLevel = lastLevel + 1;
            if(tocLevel > 6)
                tocLevel = 6;
            lastLevel = tocLevel;

            return {
                ...hd,
                tocLevel
            };
        });

        // add indexes
        let lastIndexes = [0, 0, 0, 0, 0, 0];
        headers = headers.map(hd => {
            lastIndexes = lastIndexes.map((lc, lidx) => {
                if(lidx + 1 <= hd.tocLevel)
                    return lc;
                return 0;
            });

            lastIndexes[hd.tocLevel - 1] += 1
            hd.index = lastIndexes.reduce((acc, idx) => {
                if(idx == 0)
                    return acc;
                return acc ? acc + '.' + idx : idx;
            }, '');

            return hd;
        });

        return headers;
    }


    /**
     * Normalize headers in wiki text
     *
     * @param String text
     * @param Array allHeaders
     * @return String
     */
    normalizeHeadersHtml(text, allHeaders, showEditLink) {
        const markerRegex = new RegExp(`^${ this.PARSER_MARKER_PREFIX }-h-(\\d+)-${ this.PARSER_MARKER_SUFFIX }`);

        let bits = text.split(/(<\/?h[1-6](?:.*?>))/gi);

        let inHeader = false, headerText = '';
        bits = bits.map(bt => {
            if(/^<h[1-6](?:.*?>)$/i.test(bt)) {
                inHeader = true;
                headerText = '';
            }
            else if(/^<\/h[1-6](?:.*?>)$/i.test(bt)) {
                inHeader = false;

                let headIdx = markerRegex.exec(headerText);
                if(headIdx) {
                    headerText = headerText.replace(markerRegex, '');
                    headIdx = parseInt(headIdx[1], 10);
                    let headerInfo = allHeaders.find(hd => hd.headingsIndex == headIdx);
                    let {headerHint = headerText, headerAnchor = ''} = headerInfo? headerInfo : {};

                    let out = `\n<span class="mw-headline" id="${ headerAnchor }">${ headerText }</span>`

                    if(showEditLink)
                        out += `\n<span class="mw-editsection"><span class="mw-editsection-bracket">[</span>
<a href="${ this.pageTitle.getFullURL({action: 'edit', section: headIdx + 1}) }" title="Edit section: ${ headerHint }">edit</a>
<span class="mw-editsection-bracket">]</span>`;

                    return `${ out }</span>\n${ bt }`;
                }
                return headerText + bt;
            }
            else if(inHeader) {
                headerText += bt;
                return '';
            }
            return bt;
        });
        return bits.join('');
    }


    /**
     * Normalize header title (+generate links data)
     *
     * @private
     * @param String headerTitle
     * @param Array allHeaders
     * @return Object
     */
    normalizeHeaderTitle(headerTitle, allHeaders) {
        // get internal index
        const markerRegex = `${ this.PARSER_MARKER_PREFIX }-h-(\\d+)-${ this.PARSER_MARKER_SUFFIX }`;
        let headingsIndex = (new RegExp('^' + markerRegex)).exec(headerTitle);
        if(headingsIndex)
            headingsIndex = parseInt(headingsIndex[1], 10);
        else
            headingsIndex = -1;

        if(headingsIndex >= this.headings.length)
            headingsIndex = -1;

        headerTitle = headerTitle.replace(new RegExp('^' + markerRegex + '\\s*'), '');

        // Strip out HTML form title for TOC
        const allowedTags = ['span', 'sup', 'sub', 'bdi', 'i', 'b', 's', 'strike'];
        let tocHeaderTitle = headerTitle.replace(/<(\/?)(.+?>)/gi, (a, isEnd, tagName) => {
            let attrs = '';
            if(tagName.indexOf(' ') != -1) {
                attrs = tagName.substr(tagName.indexOf(' ') + 1);
                tagName = tagName.substr(0, tagName.indexOf(' '));
            }
            if(tagName[tagName.length -1] == '>')
                tagName = tagName.substr(0, tagName.length -1);

            tagName = tagName.toLowerCase();

            if(!allowedTags.includes(tagName))
                return '';

            if(tagName == 'span' && attrs.length > 7) { // attrs - only <span> with dir=ltr/rtl
                let b = /dir\s*=\s*['"](rtl|ltr)['"]/gi.exec(attrs);
                if(b)
                    return `<span dir="${ b[1] }">`;
            }
            return `<${ isEnd ? '/' : ''}${ tagName }>`;
        });
        tocHeaderTitle = tocHeaderTitle.replace(/<span><\/span>/gi, '').trim();


        // strip out HTML for edit section hint & anchor
        let headerHint = headerTitle.replace(/<.*?>/g, '').replace(/[ _]+/g, ' ').trim();

        // Anchor
        let headerAnchor = Sanitizer.decodeCharReferencesAndNormalize(headerHint);
        try {
            const t = Title.newFromText('#' + headerAnchor, this.parserConfig);
            headerAnchor = t.getFragment();
        }
        catch(Error) {}
        headerAnchor = Sanitizer.escapeId(headerAnchor, 'legacy');

        // Anchor must be unique
        let newHeaderAnchor = headerAnchor, idx = 1;
        while(allHeaders.findIndex(hd => hd.headerAnchor == newHeaderAnchor) != -1) {
            newHeaderAnchor = `${ headerAnchor }_${ idx }`;
            idx++;
        }

        return {
            tocHeaderTitle,
            headingsIndex,
            headerHint,
            headerAnchor: newHeaderAnchor
        };
    }


    /**
     * Generate TOC from headers index
     *
     * @private
     * @param Array allHeaders
     * @return String
     */
    generateTOC(allHeaders) {
        let out = '';

        let previousLevel = 0;
        allHeaders.forEach((hd, idx) => {
            if(hd.tocLevel > previousLevel) // indent
                out += '<ul>\n'.repeat(hd.tocLevel - previousLevel);
            else if(hd.tocLevel < previousLevel)
                out += '</li>\n' + '</ul>\n</li>\n'.repeat(previousLevel - hd.tocLevel);
            else if(hd.tocLevel == previousLevel)
                out += '</li>\n';

            previousLevel = hd.tocLevel;

            let cls = `toclevel-${ hd.tocLevel } tocsection-${ idx + 1 }`;
            out += `\n<li class="${ cls }">
<a href="#${ hd.headerAnchor }">
<span class="tocnumber">${ hd.index }</span>
<span class="toctext">${ hd.text }</span>
</a>`;
        });

        if(previousLevel >= 1) {
            out += '</li>\n' + '</ul>\n</li>\n'.repeat(previousLevel - 1);
            out += '</ul>';
        }

        out = `<div id="toc" class="toc">
<input type="checkbox" role="button" id="toctogglecheckbox" class="toctogglecheckbox" style="display:none">
<div class="toctitle" dir="ltr" lang="en">
<h2>Contents</h2>
<span class="toctogglespan"><label class="toctogglelabel" for="toctogglecheckbox"></label>
</span></div>
${ out }
</div>`;

        return out;
    }


    /**
     * Make lists from lines starting with ':', '*', '#', etc.
     *
     * @param String text
     * @param Boolean lineStart Whether or not this is at the start of a line
     *     (false = first line is continuation of existing line)
     * @return String
     */
    handleBlockLevels(text, lineStart) {
        // * = ul
        // # = ol
        // ; = dt
        // : = dd
        let DTopen = false, lastParagraph = '', inPre = false, pendingPTag = false, lastPrefix = '', inBlockElem = false, inBlockquote = false;
        function _closeParagraph(atTheEnd = false) {
            let out = '';
            if(lastParagraph != '') {
                out = `</${ lastParagraph }>`;
                if(!atTheEnd)
                   out += '\n';
            }
            inPre = false;
            lastParagraph = '';
            return out;
        }


        function _openList(char) {
            let out = _closeParagraph();

            if(char == '*')
                return out + '<ul><li>';
            else if(char == '#')
                return out + '<ol><li>';
            else if(char == ':')
                return out + '<dl><dd>';
            else if(char == ';') {
                DTopen = true;
                return out + '<dl><dt>';
            }
            return '<!-- ERR 1 -->';
        }


        function _closeList(char) {
            if(char == '*')
                return '</li></ul>\n';
            else if(char == '#')
                return '</li></ol>\n';
            else if(char == ':') {
                if(DTopen) {
                    DTopen = false;
                    return '</dt></dl>\n';
                } else
                    return '</dd></dl>\n';
            }
            return '<!-- ERR 3 -->';
        }


        function _nextItem(char) {
            if(char == '*' || char == '#' )
                return '</li>\n<li>';
            else if(char == ':' || char == ';' ) {
                let close = '</dd>\n';
                if(DTopen)
                    close = '</dt>\n';
                if(char == ';') {
                    DTopen = true;
                    return close + '<dt>';
                } else {
                    DTopen = false;
                    return close + '<dd>';
                }
            }
            return '<!-- ERR 2 -->';
        }


        /* returns the length of the longest common substring of both arguments, starting at the beginning of both.*/
        function _getCommon(a, b) {
            let shorter = Math.min(a.length, b.length), i = 0;

            for(i = 0; i < shorter; ++i) {
                if(a[i] != b[i])
                    break;
            }
            return i;
        }


        /* Split up a string on ':', ignoring any occurrences inside tags to prevent illegal overlapping */
        function _findColonNoLinks(text) {
            let before = '', after = false;
            let insideTagLevel = 0;
            const emptyTags = /^<(area|frame|link|base|hr|img|meta|basefont|param|br|input|font|isindex)/i;

            text.split(/(<\/?[^>]+>)/).forEach(tg => {
                if(tg.startsWith('</'))
                    insideTagLevel--;
                else if(tg.startsWith('<') && !emptyTags.test(tg) && !/\/\s*>\s*$/.test(tg))
                    insideTagLevel++;

                if(after === false && insideTagLevel == 0 && tg.indexOf(':') != -1) {
                    before += tg.substr(0, tg.indexOf(':'));
                    after = tg.substr(tg.indexOf(':') + 1);
                }
                else if(after !== false)
                    after += tg;
                else
                    before += tg;
            });

            if(after === false)
                after = '';
            return {before, after};
        }


        let lines = text.split(/\r?\n/).map((ln, idx) => {
            ln = ln.split(/(<\/?(?:table|pre|p|ul|ol|dl|td|th|tr|dt|dd|li|blockquote)[^>]*?>\s*)/i);

            if(ln.length > 1 && ln[0] != '')
               ln.unshift('');
            return ln;
        }).flat();

        lines = lines.map((line, idx) => {
            if(!lineStart) {
                lineStart = true;
                return line;
            }
            const isLastLine = idx == lines.length -1;

            const preCloseMatch = /<\/pre/i.test(line);
            const preOpenMatch = /<pre/i.test(line);

            let out = '', out1 = line;

            let prefixLength = 0, prefix = '', prefix2 = '';
            if(!inPre) {
                prefix = /^([\*#:;]+)/.exec(line);
                prefix = prefix? prefix[1] : '';

                prefix2 = prefix.replace(/;/g, ':') // ; and : are both the same
                out1 = line.substr(prefix.length);
                inPre = preOpenMatch;
            }
            else {
                prefix = '';
                prefix2 = '';
            }

            // List generation
            if(prefix.length && lastPrefix == prefix2) {
                // Same as the last item, so no need to deal with nesting or opening stuff
                out += _nextItem(prefix.substr(-1));
                pendingPTag = false;

                if(prefix.substr(-1) == ';' ) {
                    //  The one nasty exception: definition lists work like this:
                    //  ; title : definition text
                    //  So we check for : in the remainder text to split up the
                    //  title and definition, without b0rking links.
                    let {before, after} = _findColonNoLinks(out1);
                    if(after != '') {
                        out += before.trim() + _nextItem(':');
                        out1 = after;
                    }
                }
            }
            else if(prefix.length || lastPrefix.length) {
                // We need to open or close prefixes, or both.

                // Either open or close a level...
                let commonPrefixLength = _getCommon(prefix, lastPrefix);
                pendingPTag = false;

                // Close all the prefixes which aren't shared.
                let lastPrefixLength = lastPrefix.length;
                while(commonPrefixLength < lastPrefixLength) {
                    out += _closeList(lastPrefix[lastPrefixLength - 1]);
                    --lastPrefixLength;

                    if(lastPrefixLength > 1 && lastPrefix[0] == ':')
                        DTopen = true;
                }

                // Continue the current prefix if appropriate.
                if(prefix.length <= commonPrefixLength && commonPrefixLength > 0)
                    out += _nextItem(prefix[commonPrefixLength - 1]);


                // Close an open <dt> if we have a <dd> (":") starting on this line
                if(DTopen && commonPrefixLength > 0 && prefix[commonPrefixLength - 1] == ':')
                    out += _nextItem(':');

                // Open prefixes where appropriate.
                if(lastPrefix && prefix.length > commonPrefixLength)
                    out += '\n';

                while(prefix.length > commonPrefixLength) {
                    let char = prefix[commonPrefixLength];
                    out += _openList(char);

                    if(char == ';') {
                        let {before, after} = _findColonNoLinks(out1);
                        if(after != '') {
                            out += before.trim() + _nextItem(':');
                            out1 = after;
                        }
                    }
                    ++commonPrefixLength;
                }
                if(!prefix.length && lastPrefix)
                    out += '\n';

                lastPrefix = prefix2;
            }

            // If we have no prefixes, go to paragraph mode
            if(!prefix.length) {
                let openMatch = /<((table|h1|h2|h3|h4|h5|h6|pre|p|ul|ol|dl)|\/(td|th)|\/?(tr|dt|dd|li))\b/i.test(out1);
                let closeMatch = /<(\/(table|h1|h2|h3|h4|h5|h6|pre|p|ul|ol|dl)|(td|th)|\/?(center|blockquote|div|hr|mw:))\b/i.test(out1);

                // Any match closes the paragraph, but only when `!closeMatch` do we enter block mode.
                if(openMatch || closeMatch) {
                    pendingPTag = false;
                    // Only close the paragraph if we're not inside a <pre> tag, or if
                    // that <pre> tag has just been opened
                    if(!inPre || preOpenMatch)
                        out += _closeParagraph();

                    if(preOpenMatch && !preCloseMatch)
                        inPre = true;

                    let bgReg = /<(\/?)blockquote[\s>]/ig, bqMatch;
                    while((bqMatch = bgReg.exec(out1))) {
                        inBlockquote = bqMatch[1] != '/'; // is this a close tag?
                    }

                    inBlockElem = !closeMatch;
                }
                else if(!inBlockElem && !inPre) {
                    if(/^ /.test(out1) && (lastParagraph === 'pre' || out1.trim() != '') && !inBlockquote) {
                        // pre
                        if(lastParagraph != 'pre') {
                            pendingPTag = false;
                            out += _closeParagraph() + '<pre>';
                            lastParagraph = 'pre';
                        }
                        out1 = out1.substr(1);
                    } else if(/^(<style\b[^>]*>.*?<\/style>\s*|<link\b[^>]*>\s*)+$/i.test(out1)) {
                        //  <style> or <link> by itself on a line shouldn't open or close paragraphs. But it should clear pendingPTag.
                        if(pendingPTag) {
                            out += _closeParagraph();
                            pendingPTag = false;
                        }
                    } else {
                        // paragraph
                        if(out1.trim() == '') {
                            if(pendingPTag) {
                                out += pendingPTag + '<br />';
                                pendingPTag = false;
                                lastParagraph = 'p';
                            } else if(lastParagraph != 'p') {
                                out += _closeParagraph();
                                pendingPTag = '<p>';
                            } else
                                pendingPTag = '</p><p>';
                        } else if(pendingPTag) {
                            out += pendingPTag;
                            pendingPTag = false;
                            lastParagraph = 'p';
                        } else if(lastParagraph != 'p') {
                            out += _closeParagraph() + '<p>';
                            lastParagraph = 'p';
                        }
                    }
                }
            }

            // somewhere above we forget to get out of pre block (T2785)
            if(preCloseMatch && inPre)
                inPre = false;

            if(pendingPTag === false) {
                if(prefix.length == 0) {
                    out += out1;
                    // Add a newline if there's an open paragraph
                    // or we've yet to reach the last line.
                    if(!isLastLine || lastParagraph !== '')
                       out += '\n';

                } else
                    out += out1.trim();
            }

            return out;
        });

        text = lines.join('');
        let lastPrefixLength = lastPrefix.length;
        while(lastPrefixLength) {
            text += _closeList(lastPrefix[lastPrefixLength - 1]);
            --lastPrefixLength;

            if(lastPrefixLength > 1 && lastPrefix[0] == ':')
                DTopen = true;

            if(!lastPrefixLength && lastParagraph !== '')
                text += '\n';
        }

        text += _closeParagraph(true);

        return text;
    }


    /**
     * Renders an image gallery from a text with one line per image.
     * text labels may be given by using |-style alternative text. E.g.
     *   Image:one.jpg|The number "1"
     *   Image:tree.jpg|A tree
     * given as text will return the HTML of a gallery with two images,
     * labeled 'The number "1"' and
     * 'A tree'.
     *
     * @param string text
     * @param array params
     * @return string HTML
     */
    renderImageGallery(text, attrs) {
        const IMAGE_GALLERY_MAGIC_WORDS = ['img_alt', 'img_link'];

        let {showfilename=false, caption='', perrow=false, widths=false, heights=false} = attrs;
        let ig = ImageGalleryBase.factory(attrs['mode'], this, showfilename, caption, perrow, widths, heights);

        text.split(/\r?\n/).forEach(line => {
            let matches = /^([^|]+)(\|(.*))?$/.exec(line); // File:LoremIpsum image1.jpg|Lorem ipsum dolor
            if(!matches)
                return;

            if(matches[0].indexOf('%') != -1)
                matches[1] = encodeURIComponent(matches[1]);

            let title = null;
            try {
                title = Title.newFromText(matches[1], this.parserConfig, Title.NS_FILE);
            }
            catch(e) {
                return; // ignore invalid title
            }

            let label = '';
            let alt = '';
            let link = '';

            if(matches[3]) {
                // look for an |alt= definition while trying not to break existing
                // captions with multiple pipes (|) in it, until a more sensible grammar
                // is defined for images in galleries
                let frame = new Frame(this);
                matches[3] = this.recursiveTagParse(matches[3].trim(), frame, false);

                let mwREs = IMAGE_GALLERY_MAGIC_WORDS
                    .map(mw => {
                        let m = this.magicwords.imageMagicWords[mw]
                            .reduce((txt, mw) => txt + (txt.length ? '|' : '') + mw.replace('$1', ''), ''); // i.e. ['link=$1']

                        return {
                            name: mw,
                            re: new RegExp(`^(${ m })(.*)$`)
                        };
                    });

                matches[3].split('|').forEach(param => {
                    let m = mwREs.find(mw => mw.re.exec(param))
                    if(m) {
                        if(m.name == 'img_alt')
                            alt = this.stripAltTextPrivate(m.re.exec(param)[2]);
                        else if(m.name == 'img_link') {
                            let {type, value} = this.parseLinkParameterPrivate(this.stripAltTextPrivate(m.re.exec(param)[2]));
                            if(type == 'link-url')
                                link = value;
                            else if(type == 'link-title')
                                link = value.getFullURL();
                        }
                    }
                    else
                        label = param; // Last pipe wins

                });
            }

            ig.add(title, label, alt, link, []);
        });

        return ig.toHTML();
    }
};
