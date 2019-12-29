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


/**
 * Base class for MediaWiki parser.
 *
 * @class MWParser
 */
class MWParser {
    internalParse(text) {
        // $isMain = true, $frame = false
        // # if $frame is provided, then use $frame for replacing any variables
        // if ( $frame ) {
        //     # use frame depth to infer how include/noinclude tags should be handled
        //     # depth=0 means this is the top-level document; otherwise it's an included document
        //     if ( !$frame->depth ) {
        //         $flag = 0;
        //     } else {
        //         $flag = self::PTD_FOR_INCLUSION;
        //     }
        //     $dom = $this->preprocessToDom( $text, $flag );
        //     $text = $frame->expand( $dom );
        // } else {
        //     # if $frame is not provided, then use old-style replaceVariables
        //     $text = $this->replaceVariables( $text );
        // }


        text = Sanitizer.removeHTMLtags(text, this.attributeStripCallback.bind(this),
            [false,],
            [], // $this->mTransparentTagHooks
            []
        );

        text = this.handleTables(text);

        // $text = preg_replace( '/(^|\n)-----*/', '\\1<hr />', $text );

        // $text = $this->handleDoubleUnderscore( $text );

        // $text = $this->handleHeadings( $text );
        // $text = $this->handleInternalLinks( $text );
        // $text = $this->handleAllQuotes( $text );
        // $text = $this->handleExternalLinks( $text );

        // # handleInternalLinks may sometimes leave behind
        // # absolute URLs, which have to be masked to hide them from handleExternalLinks
        // $text = str_replace( self::MARKER_PREFIX . 'NOPARSE', '', $text );

        // $text = $this->handleMagicLinks( $text );
        // $text = $this->finalizeHeadings( $text, $origText, $isMain );

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

        text.split(/\r?\n/).forEach(line => {
            line = line.trim();

            // add empty lines
            if(line == '') {
                out += line + '\n';
                return;
            }

            const first_character = line[0];
            const first_two = line.substr(0, 2);
            let matches = /^(:*)\s*\{\|(.*)$/.exec(line);

            if(matches) { // is this start of new table?
                // matches = ['{|class="wikitable" style="width: 100%;"', '', 'class="wikitable" style="width: 100%;"']
                indent_level = matches[1].length;

                // FIXME $attributes = $this->mStripState->unstripBoth( $matches[2] );
                let attributes = matches[2];
                attributes = Sanitizer.fixTagAttributes(attributes, 'table');

                line = '<dl><dd>'.repeat(indent_level) + `<table ${ attributes }>`;

                td_history.push(false);
                last_tag_history.push('');
                tr_history.push(false);
                tr_attributes.push('')
                has_opened_tr.push(false);
            }
            else if(td_history.length == 0) { // outside of td - do nothing
                out += line + '\n';
                return;
            }
            else if(first_two == '|}') { // table end
                line = '</table>' + line.substr(2);
                const last_tag = last_tag_history.pop();

                if(!has_opened_tr.pop())
                    line = `<tr><td></td></tr>${ line }`;

                if(tr_history.pop())
                    line = `</tr>${ line }`;

                if(td_history.pop())
                    line = `</${ last_tag }>${ line }`;

                tr_attributes.pop();

                if(indent_level > 0)
                    line = line.rtrim() + '</dd></dl>'.repeat(indent_level)
            }
            else if (first_two === '|-') { // table row
                line = line.replace(/^\|-/, '');

                //Whats after the tag is now only attributes
                // FIXME $attributes = $this->mStripState->unstripBoth( $line );
                let attributes = line;
                attributes = Sanitizer.fixTagAttributes(attributes, 'tr');
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

                tr_history.push(false);
                td_history.push(false);
                last_tag_history.push('');
            }
            else if(first_character == '|' || first_character == '!' || first_two == '|+') { // td, th lub caption
                if(first_two == '|+' ) {
                    first_character = '+';
                    line = line.substr(2);
                }
                else
                    line = line.substr(1);

                // Implies both are valid for table headings.
                if(first_character == '!')
                    line = StringUtils.replaceMarkup('!!', '||', line);

                line.split('||').forEach(cell => {
                    let previous = '';
                    if(first_character != '+') {
                        let tr_after = tr_attributes.pop();
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
                    let cell_data = cell.split(); // FIXME

                    // T2553: Note that a '|' inside an invalid link should not
                    // be mistaken as delimiting cell parameters
                    // Bug T153140: Neither should language converter markup.
                    if(/\[\[|-\{/.test(cell_data[0])) // ?
                        cell = `${ previous }<${ last_tag }>${ cell.trim() }`;
                    else if(cell_data.length == 1) // Whitespace in cells is trimmed
                        cell = `${ previous }<${ last_tag }>${ cell_data[0].trim() }`;
                    else {
                        // $attributes = $this->mStripState->unstripBoth( $cell_data[0] );
                        let attributes = cell_data[0];
                        attributes = Sanitizer.fixTagAttributes(attributes, last_tag);

                        // Whitespace in cells is trimmed
                        cell = `${ previous }<${ last_tag } ${ attributes }>${ cell_data[1].trim() }`;
                    }

                    line = cell;
                    td_history.push(true);
                });
            }

            out += line + '\n';
        });


        //Closing open td, tr && table
        while(td_history.length > 0 ) {
            if(td_history.pop())
                out += '</td>\n';

            if(tr_history.pop())
                out += '</tr>\n';

            if(has_opened_tr.pop())
                out += '<tr><td></td></tr>\n';

            out += '</table>\n';
        }

        //Remove trailing line-ending (b/c)
        if(out.substr(-1) == '\n')
            out = out.substr(0, out.length -1);

        //special case: don't return empty table
        if(out == '<table>\n<tr><td></td></tr>\n</table>')
            out = '';

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
        const e1 = new RegExp(`^([${ tc }]+)(?:\\|(.+?))?]](.*)\$`, ''); // Match a link having the form [[namespace:link|alternate]]trail
        const e1_img = new RegExp(`^([${ tc }]+)\\|(.*)\$`, ''); // Match cases where there is no "]]", which might still be images

        // # split the entire text string on occurrences of [[
        const bits = text.split('[[');
        let out = bits.shift(); // first bit don't have [[

        // Loop for each link
        bits.forEach(bit => {
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
                out +=  '[[' + bit; // $s .= $prefix . '[[' . $line;
                return;
            }

            // fix up urlencoded title texts
            if(m[1].indexOf('%') != -1)
                // Should anchors '#' also be rejected?
                m[1] = encodeURIComponent(m[1].replace(/</g, '&lt;').replace(/>/g, '&gt;'));

            let origLink = m[1].replace(/^[ ]*/, '');
            //console.log(bit, '----', origLink, txt, trail);

            // Don't allow internal links to pages containing
            // PROTO: where PROTO is a valid URL protocol; these
            // should be external links.
            if(new RegExp('^(?:' + Sanitizer.protocolSchemes() + ')').test(origLink)) {
                out +=  '[[' + bit; // $s .= $prefix . '[[' . $line;
                return;
            }

            let link = origLink;

            let nt = Title.newFromText(link);
            if(!nt) {
                out +=  '[[' + bit; // $s .= $prefix . '[[' . $line;
                return;
            }

            let ns = nt.getNamespace();
            let iw = nt.getInterwiki();

            // ...
        });

        return out;
    }
};
