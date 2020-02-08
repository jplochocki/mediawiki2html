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
        let root = [];
        let headingIndex = 1;

        // preprocess <includeonly>, etc.
        if(forInclusion)
            text = this.reduceTemplateForInclusion(text);
        else
            text = this.reduceTemplateForView(text);

        let bits = text.split(/(<|>|\{\{\{|\{\{|\}\}\}|\}\}|\r?\n={1,6}|={1,6}\r?\n)/);
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
                let r = this.parseExtTag(bits, i, root);
                if(typeof r == 'number') {
                    i = r;
                    continue;
                }
            }
            else if(bit == '{{') { // template begin

            }
            else if(bit == '{{{') {
            }
            else if(/^\r?\n={1,6}$/.test(bit)) { // headers
                let level = bit.trim().length; // check level
                let rhe = new RegExp('^' + '='.repeat(level) + '\\r?\\n$')

                let headerEnd = bits.findIndex((bt, idx) => idx > i && rhe.test(bt)); // find header end
                if(headerEnd == -1) {
                    textBit(bit);
                    continue;
                }
                let title = bits.slice(i + 1, headerEnd);
                if(title.find(bt => /^\r?\n={1,6}$/.test(bt))) {
                    textBit(bit);
                    continue;
                }
                title = title.join('');

                root.push({
                    type: 'header',
                    title,
                    level,
                    index: headingIndex++
                });

                i = headerEnd;
                continue;
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
            let inOnlyIncludeSection = false;
            text = bits.reduce((resultTxt, bt) => {
                if(bt == '<onlyinclude>')
                    inOnlyIncludeSection = true;
                else if(inOnlyIncludeSection && /(<\/?(?:includeonly|noinclude|onlyinclude)>)/.test(bt))
                    inOnlyIncludeSection = false;
                else if(inOnlyIncludeSection)
                    resultTxt += bt;

                return resultTxt;
            }, '');
        } else { // <inlcudeonly> + text outside <noinclude>
            let inNoIncludeSection = false;
            text = bits.reduce((resultTxt, bit) => {
                if(/<\/?noinclude>/.test(bit)) {
                    inNoIncludeSection = bit == '<noinclude>';
                    return resultTxt;
                }
                if(bit == '<includeonly>')
                    inNoIncludeSection = false;
                if(inNoIncludeSection || /<\/?includeonly>/.test(bit))
                    return resultTxt;

                resultTxt += bit;
                return resultTxt;
            }, '');
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

        let inIncludeSection = false;
        text = bits.reduce((resultTxt, bit) => {
                if(/<\/?includeonly>/.test(bit)) {
                    inIncludeSection = bit == '<includeonly>';
                    return resultTxt;
                }
                if(inIncludeSection)
                    return resultTxt;

                return resultTxt + bit;
            }, '');

        return text;
    }


    /**
     * Parse extension tag
     */
    parseExtTag(bits, startTagIdx, root) {
        let xmlishElements = this.parser.getStripList();

        // find <tagName attrs>
        const endIdx = bits.findIndex((bt, idx) => idx > startTagIdx && bt == '>');
        if(endIdx == -1)
            return false;

        let tagName =  bits.slice(startTagIdx + 1, endIdx).join('').trim();
        if(tagName[0] == '/') // ignore end tag here
            return false;

        let noCloseTag = /\/$/.test(tagName);
        if(noCloseTag)
            tagName = tagName.substr(0, tagName.length -1).trim();

        tagName = tagName.split(/(\s+)/);
        const attributes = Sanitizer.decodeTagAttributes(tagName.slice(1).join('').trim());
        tagName = tagName[0].toLowerCase();

        if(!xmlishElements.includes(tagName))
            return false;

        // find tag text and end
        let tagText = '';
        let foundEndTagIdx = noCloseTag ? endIdx : false;
        let endReached = false;
        if(!noCloseTag) {
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
        }

        if(foundEndTagIdx !== false) {
            root.push({
                type: 'ext-tag',
                tagName,
                attributes,
                noCloseTag,
                tagText,
            });
            return foundEndTagIdx; // skip tag and it's content
        }
        // if foundEndTagIdx === false, invalid tag end, do not parse whole tag
        return false;
    }
};
