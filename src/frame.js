/**
 * Preprocessor output object.
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


class Frame {
    /**
     * @param Parser parser
     * @param Frame [parentFrame=null] parent frame, if available
     */
    constructor(parser, parentFrame=null) {
        this.MAX_TEMPLATE_DEPTH = 40;

        this.parser = parser;
        this.preprocessor = parser.preprocessor;
        this.loopCheckTitles = [];
        this.parentFrame = parentFrame;

        this.deep = 0;
        let pf = parentFrame;
        while(pf != null) {
            pf = pf.parentFrame;
            this.deep++;
        }
    }

    /**
     * Expand a document tree node
     *
     * @param Array root
     * @return String
     */
    expand(root, parentTemplateArgs=null) {
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
            // headers
            else if(el.type == 'header') {
                let [begin, end] = el.headerType == 'header-tag' ? [`<h${ el.level }>`, `</h${ el.level }>`] : ['\n' + '='.repeat(el.level), '='.repeat(el.level) + '\n'];
                out += `${ begin }${ el.title }${ end }`;
                this.parser.headings.push({
                    title: el.title,
                    level: el.level
                });
            }
            // template
            else if(el.type == 'template') {
                out += this.parser.templateSubstitution(el.name, el.params, this, parentTemplateArgs);
            }
            // template argument
            else if(el.type == 'template-argument') {
                out += this.parser.templateArgSubstitution(el, this, parentTemplateArgs);
            }
        });

        return out;
    }


    /**
     * Detect template loop or max deep
     *
     * @param String templateTitle title of template (as returned by Title.getPrefixedText())
     * @return {loopDetected: Boolean, maxDeepDetected: Boolean, templateLoopDetected: Boolean}
     */
    loopDetection(templateTitle) {
        if(this.deep >= this.MAX_TEMPLATE_DEPTH)
            return {loopDetected: true, maxDeepDetected: true};

        // check title in parent frames
        let pf = this.parentFrame;
        while(pf) {
            pf = pf.parentFrame;

            if(pf && pf.loopCheckTitles.includes(templateTitle))
                return {loopDetected: true, templateLoopDetected: true};
        }

        return {loopDetected: false};
    }
}
