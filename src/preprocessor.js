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
        let xmlishAllowMissingEndTag = ['includeonly', 'noinclude', 'onlyinclude'];
        xmlishElements += xmlishAllowMissingEndTag;
        let bits = text.split(/(<|>|\{\{\{|\{\{|\}\}\}|\}\})/);

        let root = [];

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
                tagName = tagName[0];

                if(!xmlishElements.includes(tagName)) {
                    textBit(bit);
                    continue;
                }

                // find tag text and end
                let tagText = '';
                let foundEndTagIdx = false;
                let noCloseTag = false;
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

                        if(xmlishAllowMissingEndTag.includes(tagName)) {
                            foundEndTagIdx = j - 1;
                            noCloseTag = true;
                            break;
                        }
                        else {
                            foundEndTagIdx = false;
                            break;
                        }
                    }
                    else
                        tagText += bits[j];

                    if(j == bits.length - 1)
                        endReached = true;
                }

                if(endReached && xmlishAllowMissingEndTag.includes(tagName)) {
                    foundEndTagIdx = bits.length;
                    noCloseTag = true;
                }

                if(foundEndTagIdx !== false) {
                    i = foundEndTagIdx; // skip tag and it's content

                    root.push({
                        type: 'ext-tag',
                        tagName,
                        attributes,
                        tagText,
                        noCloseTag
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
     * Expand a document tree node
     *
     * @param Array root
     * @return String
     */
    expand(root) {
        let out = '';

        root.forEach(el => {
            if(typeof el == 'string') {
                out += el;
                return;
            }
            else if(typeof el != 'object')
                return;

            // Extension tag
            if(el.type == 'ext-tag') {
                out += this.parser.extensionSubstitution(el, this);
            }
        });

        return out;
    }
};
