/**
 * String utils for parser.
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
 *
 * @class StringUtils
 */
export class StringUtils {
    /**
     * More or less "markup-safe" str_replace()
     * Ignores any instances of the separator inside `<...>`
     *
     * @param string $search
     * @param string $replace
     * @param string $text
     * @return string
     */
    static replaceMarkup(search, replace, text) {
        const placeholder = "\x00";

        // Remove placeholder instances
        text = text.replace(new RegExp(StringUtils.preg_quote(placeholder), 'g'), '');

        // Replace instances of the separator inside HTML-like tags with the placeholder
        let cleaned = StringUtils.delimiterReplaceCallback(
            '<', '>', (matches) => {
                return matches[0].replace(new RegExp(StringUtils.preg_quote(search), 'g'), placeholder);
            },
            text
        );

        // Explode, then put the replaced separators back in
        cleaned = cleaned.replace(new RegExp(StringUtils.preg_quote(search), 'g'), replace);
        text = cleaned.replace(new RegExp(StringUtils.preg_quote(placeholder), 'g'), search);

        return text;
    }


    /**
     * Perform an operation equivalent to `preg_replace_callback()`
     *
     * Matches this code:
     *
     *     preg_replace_callback( "!$startDelim(.*)$endDelim!s$flags", $callback, $subject );
     *
     * If the start delimiter ends with an initial substring of the end delimiter,
     * e.g. in the case of C-style comments, the behavior differs from the model
     * regex. In this implementation, the end must share no characters with the
     * start, so e.g. `/*\/` is not considered to be both the start and end of a
     * comment. `/*\/xy/*\/` is considered to be a single comment with contents `/xy/`.
     *
     * The implementation of delimiterReplaceCallback() is slower than hungryDelimiterReplace()
     * but uses far less memory. The delimiters are literal strings, not regular expressions.
     *
     * @param string $startDelim Start delimiter
     * @param string $endDelim End delimiter
     * @param callable $callback Function to call on each match
     * @param string $subject
     * @param string $flags Regular expression flags
     * @throws InvalidArgumentException
     * @return string
     */
    static delimiterReplaceCallback(startDelim, endDelim, callback, subject, flags='') {
        let inputPos = 0;
        let outputPos = 0;
        let contentPos = 0;
        let output = '';
        let foundStart = false;
        let encStart = StringUtils.preg_quote(startDelim, '!');
        let encEnd = StringUtils.preg_quote(endDelim, '!');
        let endLength = endDelim.length;
        let m = [];
        flags += flags.indexOf('g') == -1 ? 'g' : '';

        const re = new RegExp(`(${ encStart })|(${ encEnd })`, flags);

        while(inputPos < subject.length && (m = re.exec(subject))) {
            let tokenOffset = re.lastIndex;
            let tokenType, tokenLength;
            if(m[1]) {
                tokenOffset -= startDelim.length;
                if(foundStart && subject.substr(tokenOffset, endLength) == endDelim) {
                    // An end match is present at the same location
                    tokenType = 'end';
                    tokenLength = endLength;
                } else {
                    tokenType = 'start';
                    tokenLength = startDelim.length;
                }
            }
            else if(m[2]) {
                tokenOffset -= endLength;
                tokenType = 'end';
                tokenLength = endLength;
            }
            else
                throw new Error('Invalid delimiter given to StringUtils.delimiterReplaceCallback()');

            if(tokenType == 'start') {
                // Only move the start position if we haven't already found a start
                // This means that START START END matches outer pair
                if (!foundStart) {
                    // Found start
                    inputPos = tokenOffset + tokenLength;
                    // Write out the non-matching section
                    output += subject.substr(outputPos, tokenOffset - outputPos);
                    outputPos = tokenOffset;
                    contentPos = inputPos;
                    foundStart = true;
                } else {
                    // Move the input position past the *first character* of START,
                    // to protect against missing END when it overlaps with START
                    inputPos = tokenOffset + 1;
                }
            }
            else if(tokenType == 'end') {
                if(foundStart) {
                    // Found match
                    output += callback([
                        subject.substr(outputPos, tokenOffset + tokenLength - outputPos),
                        subject.substr(contentPos, tokenOffset - contentPos)
                    ]);
                    foundStart = false;
                } else {
                    // Non-matching end, write it out
                    output += subject.substr(inputPos, tokenOffset + tokenLength - outputPos);
                }
                inputPos = outputPos = tokenOffset + tokenLength;
            }
            else
                throw new Error('Invalid delimiter given to StringUtils.delimiterReplaceCallback()');
        }

        if(outputPos < subject.length)
            output += subject.substr(outputPos);

        return output;
    }


    /**
     * PHP's preg_quote in JavaScript replacement
     */
    static preg_quote(str, delimiter='') {
        //  discuss at: https://locutus.io/php/preg_quote/
        // original by: booeyOH
        // improved by: Ates Goral (https://magnetiq.com)
        // improved by: Kevin van Zonneveld (https://kvz.io)
        // improved by: Brett Zamir (https://brett-zamir.me)
        // bugfixed by: Onno Marsman (https://twitter.com/onnomarsman)
        return (str + '')
            .replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\' + (delimiter || '') + '-]', 'g'), '\\$&');
    }
};


/**
 * calculate thumb size for image
 *
 * @param Number width
 * @param Number heigth
 * @param Number|Boolean [thumbWidth=false]
 * @param Number|Boolean [thumbHeigth=false]
 * @return Array width and height of thumb
 */
export function calcThumbnailSize(width, height, thumbWidth=false, thumbHeight=false) {
    if(width <= thumbWidth || (thumbWidth === false && thumbHeight === false))
        return [width, height];

    if(thumbWidth !== false) {
        let result = [
            thumbWidth,
            Math.round((height * thumbWidth) / width)
        ];

        if(!(thumbHeight !== false && result[1] > thumbHeight))
            return result;
    }

    return [
        Math.round((width * thumbHeight) / height),
        thumbHeight
    ];
}
