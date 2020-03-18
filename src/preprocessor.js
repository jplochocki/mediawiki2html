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

        let bits = text.split(/(<|>|\{{1,}|\}{1,}|\||\r?\n={1,6}(?=[^=])|={1,6}\r?\n)/);

        // reduce matching { and }
        bits = bits.map(bt => {
            if(!/\{|\}/.test(bt))
                return bt;

            if(['{{', '{{{', '}}', '}}}'].includes(bt))
                return bt;

            if(bt.length == 5 && bt[0] == '{') // template arg + template
                return ['{{', '{{{'];
            else if(bt.length == 5 && bt[0] == '}')
                return ['}}}', '}}'];

            // else - nested templates
            let r = Array.from({length: Math.floor(bt.length / 2)}, () => bt[0].repeat(2));
            if(bt.length % 2 == 1)
                r.push(bt[0]);

            return r;
        }).flat();

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

            // extension tags (+header tags)
            if(bit == '<') {
                let r = this.parseExtTag(bits, i, root, headingIndex);
                if(Array.isArray(r)) {
                    ([i, headingIndex] = r);
                    continue;
                }
            }
            // templates
            else if(bit == '{{') {
                let r = this.parseTemplate(bits, i, root);
                if(r !== false) {
                    i = r;
                    continue;
                }
            }
            // template argument
            else if(bit == '{{{') {
                let r = this.parseTemplateArgument(bits, i, root);
                if(r !== false) {
                    i = r;
                    continue;
                }
            }
            // headers
            else if(/^\r?\n={1,6}$/.test(bit)) {
                let r = this.parseHeaders(bits, i, root, headingIndex);
                if(Array.isArray(r)) {
                    ([i, headingIndex] = r);
                    continue;
                }
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
     * Parse extension tag (+headers based on <hX> tags)
     */
    parseExtTag(bits, startTagIdx, root, headingIndex) {
        let xmlishElements = [...this.parser.getStripList(), 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

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
            if(/^h[1-6]$/.test(tagName)) {
                let level = parseInt(tagName[1], 10);
                root.push({
                    type: 'header',
                    headerType: 'header-tag',
                    title: tagText,
                    level,
                    index: headingIndex++
                });
            }
            else
                root.push({
                    type: 'ext-tag',
                    tagName,
                    attributes,
                    noCloseTag,
                    tagText,
                });
            return [foundEndTagIdx, headingIndex]; // skip tag and it's content
        }
        // if foundEndTagIdx === false, invalid tag end, do not parse whole tag
        return false;
    }


    /**
     * Parse headers based on equal signs (=header=)
     */
    parseHeaders(bits, startIdx, root, headingIndex) {
        let bit = bits[startIdx];
        let level = bit.trim().length; // check level
        let rhe = new RegExp('^' + '='.repeat(level) + '\\r?\\n$');

        let headerEnd = bits.findIndex((bt, idx) => idx > startIdx && rhe.test(bt)); // find header end
        if(headerEnd == -1)
            return false;

        let title = bits.slice(startIdx + 1, headerEnd);
        if(title.find(bt => /^\r?\n={1,6}$/.test(bt)))
            return false;

        title = title.join('');

        root.push({
            type: 'header',
            headerType: 'equal-signs',
            title,
            level,
            index: headingIndex++
        });

        return [headerEnd, headingIndex];
    }


    /**
     * Parse templates
     */
    parseTemplate(bits, startIdx, root) {
        let bt = bits.slice(startIdx + 1);
        let realIdx = startIdx;

        function _readNextPart() {
            let foundPartEnd = false;
            let templateLevel = 0;
            let templateParamLevel = 0;

            bt.some((b, i) => {
                realIdx++;
                if(templateLevel == 0 && templateParamLevel == 0 && /^\|$/.test(b)) {
                    foundPartEnd = i;
                    return true;
                }
                else if(b == '{{')
                    templateLevel++;
                else if(b == '}}') {
                    templateLevel--;
                    if(templateLevel < 0) { // end of main template {{
                        foundPartEnd = i;
                        return true;
                    }
                }
                else if(b == '{{{')
                    templateParamLevel++;
                else if(b == '}}}')
                    templateParamLevel--;
                return false;
            });

            if(foundPartEnd !== false)
                return [bt.slice(0, foundPartEnd), bt.slice(foundPartEnd)];
            return [false, false];
        }

        // get template name
        let templateName = '';
        ([templateName, bt] = _readNextPart());
        if(templateName === false)
            return false;
        templateName = templateName.join('').trim();
        templateName = templateName[0].toUpperCase() + templateName.substr(1);

        // read params
        let templateParams = {}, positionalParams = 1;
        if(bt[0] == '|') {
            let a = '', b = '';
            while(bt[0] != '}}' && bt.length > 0) {
                if(bt[0] == '|') {
                    bt.shift();
                    continue;
                }

                ([a, bt] = _readNextPart());
                if(a === false || bt.length == 0)
                    return false;
                a = a.join('');

                if(a.indexOf('=') != -1) { // value for named param
                    b = a.substr(a.indexOf('=') + 1);
                    a = a.substr(0, a.indexOf('='));
                    if(a == '')
                        continue;
                    templateParams[a] = b;
                }
                else {
                    templateParams[positionalParams] = a;
                    positionalParams++;
                }

            }
        }

        if(bt.length == 0 || bt[0] != '}}') // template end not found
            return false;

        root.push({
            type: 'template',
            name: templateName,
            params: templateParams
        });

        return realIdx;
    }


    /**
     * Parse template argument
     */
    parseTemplateArgument(bits, startIdx, root) {
        // find param end
        let endIdx = bits.findIndex((bt, idx) => idx > startIdx && (bt == '}}}' || bt == '{{{'));
        if(endIdx == -1 || bits[endIdx] == '{{{')
            return false;

        let paramName = bits.slice(startIdx + 1, endIdx);

        // get default value
        let defaultValue = '';
        if(paramName.length > 2 && paramName[1] == '|') {
            let nextDefValFound = false, templateLevel = 0;

            defaultValue = paramName.slice(2).filter(b => { // reduce to next |, do not drop nested templates
                if(b == '{{')
                    templateLevel++;
                else if(b == '}}')
                    templateLevel--;

                if(templateLevel <= 0 && b == '|')
                    nextDefValFound = true;

                return !nextDefValFound;
            }).join('');

            if(bits[endIdx] == '}}}' && bits[endIdx +1] == '}}') { // have }}} and }} after, for {{{param|{{nested template}}}}}
                endIdx++;
                defaultValue += '}}';
            }
        }
        paramName = paramName[0].trim();
        if(paramName == '')
            return false;

        root.push({
            type: 'template-argument',
            name: paramName,
            defaultValue: defaultValue
        });

        return endIdx;
    }
};
