/**
 * Preprocessor for wiki text templates and tags.
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


class Preprocessor {
    constructor(parser) {
        this.parser = parser;
    }


    /**
     * Preprocess some wikitext and return the document tree.
     *
     * @param String text
     * @param Boolean [forInclusion=false] handle "<noinclude>" and
     * "<includeonly>" as if the text is being included
     * @return
     */
    preprocessToObj(text, forInclusion=false) {
        let xmlishElements = this.parser.getStripList();
        let root = [];

        // preprocess <includeonly>, etc.
        if(forInclusion)
            text = this.reduceTemplateForInclusion(text);
        else
            text = this.reduceTemplateForView(text);

        let bits = text.split(/(<|>|\{\{\{|\{\{|\}\}\}|\}\})/);
        function textBit(bit) {
            if(typeof root[root.length -1] == 'string')
                root[root.length -1] += bit;
            else
                root.push(bit);
        }

        for(let i = 0; i < bits.length; i++) {
            const bit = bits[i];
            if(bit == '')
                continue;

            // tag begins
            if(bit == '<') {
                // find <tagName attrs>
                const endIdx = bits.findIndex((bt, idx) => idx > i && bt == '>');
                if(endIdx == -1) {
                    textBit(bit);
                    continue;
                }

                let tagName =  bits.slice(i + 1, endIdx).join('').trim();
                if(tagName[0] == '/') { // ignore end tag here
                    textBit(bit);
                    continue;
                }

                tagName = tagName.split(/(\s+)/);
                const attributes = Sanitizer.decodeTagAttributes(tagName.slice(1).join('').trim());
                tagName = tagName[0].toLowerCase();

                if(!xmlishElements.includes(tagName)) {
                    textBit(bit);
                    continue;
                }

                // find tag text and end
                let tagText = '';
                let foundEndTagIdx = false;
                let endReached = false;
                for(let j = endIdx + 1; j < bits.length; j++) {
                    if(bits[j] == '<' && bits[j + 1] == '/' + tagName && bits[j + 2] == '>') {
                        foundEndTagIdx = j + 2;
                        break;
                    }
                    else if(bits[j] == '<') {
                        let n = (bits[j + 1] + '').trim().split(/(\s+)/)[0];
                        if(!xmlishElements.includes(n)) {
                            tagText += bits[j];
                            continue;
                        }

                        foundEndTagIdx = false;
                        break;
                    }
                    else
                        tagText += bits[j];

                    if(j == bits.length - 1)
                        endReached = true;
                }

                if(foundEndTagIdx !== false) {
                    i = foundEndTagIdx; // skip tag and it's content

                    root.push({
                        type: 'ext-tag',
                        tagName,
                        attributes,
                        tagText,
                    });
                    continue;
                }
                // if foundEndTagIdx === false, invalid tag end, do not parse whole tag
            }
            else if(bit == '{{') { // template begin

            }
            else if(bit == '{{{') {
            }

            // treat the rest as text
            textBit(bit);
        };

        return root;
    }


    /**
     * Get template text for include in page
     *
     * @param String text
     * @return String
     */
    reduceTemplateForInclusion(text) {
        let bits = text.split(/(<\/?(?:includeonly|noinclude|onlyinclude)>)/);

        // use onlyinclude before every else
        if(bits.includes('<onlyinclude>')) {
            text = bits.reduce(([resultTxt, proposition, inOnlyIncludeSection], bt) => {
                if(bt == '<onlyinclude>') {
                    inOnlyIncludeSection = true;
                    proposition = '';
                }
                else if(inOnlyIncludeSection && /(<\/?(?:includeonly|noinclude|onlyinclude)>)/.test(bt)) {
                    resultTxt += proposition;
                    proposition = '';
                    inOnlyIncludeSection = false;
                }
                else if(inOnlyIncludeSection)
                    proposition += bt;

                return [resultTxt, proposition, inOnlyIncludeSection];
            }, ['', '', false]);
            text = text[0] + text[1];
        } else { // <inlcudeonly> + text outside <noinclude>
            text = bits.reduce(([resultTxt, inNoIncludeSection], bit) => {
                if(/<\/?noinclude>/.test(bit)) {
                    inNoIncludeSection = bit == '<noinclude>';
                    return [resultTxt, inNoIncludeSection];
                }
                if(bit == '<includeonly>')
                    inNoIncludeSection = false;
                if(inNoIncludeSection || /<\/?includeonly>/.test(bit))
                    return [resultTxt, inNoIncludeSection];

                resultTxt += bit;
                return [resultTxt, inNoIncludeSection];
            }, ['', false])[0];
        }

        return text;
    }


    /**
     * Get template text for view
     *
     * @param String text
     * @return String
     */
    reduceTemplateForView(text) {
        let bits = text.split(/(<\/?(?:includeonly|noinclude|onlyinclude)>)/);

        // just drop <onlyinclude> and <noinclude> tags
        bits = bits.filter(bit => !/<\/?(onlyinclude|noinclude)>/.test(bit));

        text = bits.reduce(([resultTxt, inIncludeSection], bit) => {
                if(/<\/?includeonly>/.test(bit)) {
                    inIncludeSection = bit == '<includeonly>';
                    return [resultTxt, inIncludeSection];
                }
                if(inIncludeSection)
                return [resultTxt, inIncludeSection];

                resultTxt += bit;
                return [resultTxt, inIncludeSection];
            }, ['', false])[0];

        return text;
    }
};
