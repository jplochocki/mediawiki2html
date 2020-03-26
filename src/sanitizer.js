/**
 * Rewritten HTML sanitizer for MediaWiki (includes/parser/Sanitizer.php).
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
 * @class Sanitizer
 */
class Sanitizer {
    /**
     * Normalize text fragment listing an HTML element's attributes,
     * discarding unwanted attributes.
     *
     * @static
     * @param String attributesText
     * @param String elementName
     * @param Boolean [returnSorted=false]
     * @return String
     */
    static fixTagAttributes(attributesText, elementName, returnSorted=false) {
        if(attributesText.trim() == '')
            return '';

        const decoded = Sanitizer.decodeTagAttributes(attributesText);
        const stripped = Sanitizer.validateTagAttributes(decoded, elementName);

        return Sanitizer.safeEncodeTagAttributes(stripped, returnSorted);
    }


    /**
     * Return Object (attributeName:atribute value) from converted attributes
     * text. Normalize attribute name and value.
     *
     * @static
     * @param String text
     * @return Object
     */
    static decodeTagAttributes(text) {
        if(text.trim() == '')
            return {};

        let attribs = {}, match = null;
        const pattern = Sanitizer.getAttribsRegex();
        while((match = pattern.exec(text))) {
            // match = ['class="wikitable"', 'class', '="wikitable"', 'wikitable', undefined, undefined, undefined]
            let name = match[1].toLowerCase();
            let value = null;
            if(match[5] !== undefined) // No quotes.
                value = match[5];
            else if(match[4] !== undefined) // Single-quoted
                value = match[4];
            else if (match[3] !== undefined) // Double-quoted
                value = match[3];
            else if(match[1] !== undefined) // empty attribute
                value = '';
            else
                continue;

            value = value.replace(/[\t\r\n ]+/g, ' ').trim(); // normalize whitespaces

            // filter attribute names with unacceptable characters
            if(!Sanitizer.getAttribNameRegex().test(name))
                continue;

            attribs[name] = he.decode(value, {
                isAttributeValue: true
            });
        }
        return attribs;
    }


    /**
     * Convert Object(attributeNam:value) to HTML attribute's string
     *
     * @static
     * @param Object attrs
     * @param Boolean [returnSorted=false]
     * @return String
     */
    static safeEncodeTagAttributes(attrs, returnSorted=false) {
        let a = Object.entries(attrs);

        if(returnSorted)
            a = a.sort(([a_name, a_], [b_name, b_]) => {
                if(a_name < b_name)
                    return -1;
                if(a_name > b_name)
                    return 1;
                return 0;
            });

        return  a.map(([name, value]) => {
            name = he.encode(name);
            value = he.encode(he.escape(value));
            return `${ name }="${ value }"`;
        }).join(' ');
    }


    /**
     * Regular expression to match HTML/XML attribute pairs within a tag.
     *
     * @static
     * @return RegExp
     */
    static getAttribsRegex() {
        const spaceChars = '\x09\x0a\x0c\x0d\x20';
        const space = `[${ spaceChars }]`;
        const attrib = `[^${ spaceChars }\/>=]`;
        const attribFirst = `(?:${ attrib }|=)`;
        const attribsRegex = new RegExp(
            `(${ attribFirst }${ attrib }*)(${ space }*=${ space }*(?:\"([^\"]*)(?:\"|\$)|'([^']*)(?:'|\$)|(((?!${ space }|>).)*)))?`,
            'gu');

        return attribsRegex;
    }


    /**
     * RegExp for attribute name check
     *
     * @static
     * @return RegExp
     */
    static getAttribNameRegex() {
        const letters = 'A-Za-z\u00AA\u00B5\u00BA\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-'
            + '\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F'
            + '\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6'
            + '\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815'
            + '\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B4\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F'
            + '\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A'
            + '\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-'
            + '\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C'
            + '\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-'
            + '\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-'
            + '\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8'
            + '\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E'
            + '\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-'
            + '\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-'
            + '\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A'
            + '\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-'
            + '\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5'
            + '\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-'
            + '\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16F1-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-'
            + '\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E'
            + '\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-'
            + '\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-'
            + '\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4'
            + '\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071'
            + '\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-'
            + '\u213F\u2145-\u2149\u214E\u2183\u2184\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25'
            + '\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-'
            + '\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005\u3006\u3031-\u3035\u303B\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA'
            + '\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD'
            + '\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6E5\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AD'
            + '\uA7B0-\uA7B7\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD'
            + '\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-'
            + '\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-'
            + '\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-'
            + '\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28'
            + '\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-'
            + '\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC';
        const numbers = '0-9';
        const attribFirst = `[:_${ letters }${ numbers }]`;
        const attrib = `[:_\.\-${ letters }${ numbers }]`;
        const attribNameRegex = new RegExp(`^(${ attribFirst }${ attrib }*)$`, 'gu');
        return attribNameRegex;
    }


    /**
     * Take an Object(attribute name: value) and normalize or discard
     * illegal values for the given element type.
     *
     * @static
     * @param Object attribs
     * @param String element
     * @return Object
     */
    static validateTagAttributes(attribs, element) {
        return Sanitizer.validateAttributes(attribs, Sanitizer.attributeWhitelistInternal(element));
    }


    /**
     * Gets all valid protocols schemes
     *
     * @return String[]
     */
    static protocolSchemes() {
        return [
            'bitcoin:', 'ftp://', 'ftps://', 'geo:', 'git://', 'gopher://', 'http://',
            'https://', 'irc://', 'ircs://', 'magnet:', 'mailto:', 'mms://', 'news:',
            'nntp://', 'redis://', 'sftp://', 'sip:', 'sips:', 'sms:', 'ssh://',
            'svn://', 'tel:', 'telnet://', 'urn:', 'worldwind://', 'xmpp:', '//'
        ];
    }


    /**
     * Take an Object(attribute name: value) and normalize or discard
     * illegal values for the given whitelist.
     *
     * @static
     * @param Object attribs
     * @param String element
     * @return Object
     */
    static validateAttributes(attribs, whitelist) {
        const protocols = Sanitizer.protocolSchemes();
        const hrefExp = new RegExp('^(' + protocols.join('|') + ')', 'i');
        const EVIL_URI_PATTERN = /(^|\s|\*\/\s*)(javascript|vbscript)([^\w]|$)/i;
        const XMLNS_ATTRIBUTE_PATTERN = /^xmlns:[:A-Z_a-z-.0-9]+$/;


        const out = {};
        Object.entries(attribs).forEach(([name, value]) => {
            // Allow XML namespace declaration to allow RDFa
            if(XMLNS_ATTRIBUTE_PATTERN.test(name)) {
                if(!EVIL_URI_PATTERN.test(value))
                    out[name] = value;
                return;
            }

            // Allow any attribute beginning with "data-"
            // However:
            // * Disallow data attributes used by MediaWiki code
            // * Ensure that the attribute is not namespaced by banning colons.
            if((!/^data-[^:]*$/i.test(name) && whitelist.indexOf(name) == -1) || /^data-(ooui|mw|parsoid)/i.test(name))
                return;

            // Strip javascript "expression" from stylesheets.
            if(name == 'style')
                value = Sanitizer.checkCss(value);

            // Escape HTML id attributes
            if(name == 'id')
                value = Sanitizer.escapeId(value);

            // Escape HTML id reference lists
            if(['aria-describedby', 'aria-flowto', 'aria-labelledby', 'aria-owns'].indexOf(name) != -1)
                value = Sanitizer.escapeIdReferenceList(value);

            // RDFa and microdata properties allow URLs, URIs and/or CURIs.
            // Check them for sanity.
            if(['rel', 'rev', 'about', 'property', 'resource', 'datatype',
                'typeof', 'itemid', 'itemprop', 'itemref', 'itemscope', 'itemtype'].indexOf(name) != -1)
                // Paranoia. Allow "simple" values but suppress javascript
                if(EVIL_URI_PATTERN.test(value))
                    return;

            // NOTE: even though elements using href/src are not allowed directly, supply
            // validation code that can be used by tag hook handlers, etc
            if(['href', 'src', 'poster'].indexOf(name) != -1)
                if(!hrefExp.test(value))
                    return; // drop any href or src attributes not using an allowed protocol.
                    // NOTE: this also drops all relative URLs

            // If this attribute was previously set, override it.
            // Output should only have one attribute of each name.
            out[name] = value;
        });

        // itemtype, itemid, itemref don't make sense without itemscope
        if(!('itemscope' in out)) {
            delete out['itemtype'];
            delete out['itemid'];
            delete out['itemref'];
        }

        return out;
    }


    /**
     * Fetch whitelist fot given element
     *
     * @static
     * @param String element
     * @return String[]
     */
    static attributeWhitelistInternal(element) {
        const list = Sanitizer.setupAttributeWhitelistInternal();
        return list[element] || [];
    }


    /**
     * Create whitelist for all tags. Object(tagName: array of attrs)
     *
     * @static
     * @return Object[String[]]
     */
    static setupAttributeWhitelistInternal() {
        if(Sanitizer._whitelist)
            return Sanitizer._whitelist;

        const common = [
            // HTML
            'id', 'class', 'style', 'lang', 'dir', 'title',

            // WAI-ARIA
            'aria-describedby', 'aria-flowto', 'aria-label', 'aria-labelledby', 'aria-owns', 'role',

            // RDFa
            'about', 'property', 'resource', 'datatype', 'typeof',

            // Microdata
            'itemid', 'itemprop', 'itemref', 'itemscope', 'itemtype'
        ];

        const block = [...common, 'align'];

        const tablealign = ['align', 'valign'];
        const tablecell = [
            'abbr', 'axis', 'headers', 'scope', 'rowspan', 'colspan',
            'nowrap', 'width', 'height', 'bgcolor', // deprecated
        ];

        Sanitizer._whitelist = {
            'div': [...block],
            'center': [...common], // deprecated
            'span': [...common],
            'h1': [...block],
            'h2': [...block],
            'h3': [...block],
            'h4': [...block],
            'h5': [...block],
            'h6': [...block],
            'bdo': [...common],
            'em': [...common],
            'strong': [...common],
            'cite': [...common],
            'dfn': [...common],
            'code': [...common],
            'samp': [...common],
            'kbd': [...common],
            'var': [...common],
            'abbr': [...common],
            'blockquote': [...common, 'cite'],
            'q': [...common, 'cite'],
            'sub': [...common],
            'sup': [...common],
            'p': [...block],
            'br': [...common, 'clear'],
            'wbr': [...common],
            'pre': [...common, 'width'],
            'ins': [...common, 'cite', 'datetime'],
            'del': [...common, 'cite', 'datetime'],
            'ul': [...common, 'type'],
            'ol': [...common, 'type', 'start', 'reversed'],
            'li': [...common, 'type', 'value'],
            'dl': [...common],
            'dd': [...common],
            'dt': [...common],
            'table': [...common, 'summary', 'width', 'border', 'frame', 'rules', 'cellspacing', 'cellpadding', 'align', 'bgcolor'],
            'caption': [...block],
            'thead': [...common],
            'tfoot': [...common],
            'tbody': [...common],
            'colgroup': [...common, 'span'],
            'col': [...common, 'span'],
            'tr': [...common, 'bgcolor', ...tablealign],
            'td': [...common, ...tablecell, ...tablealign],
            'th': [...common, ...tablecell, ...tablealign],
            // NOTE: <a> is not allowed directly, but the attrib whitelist is used from the Parser object
            'a': [...common, 'href', 'rel', 'rev'],
            // Not usually allowed,
            'img': [...common, 'alt', 'src', 'width', 'height', 'srcset'],

            'audio': [...common, 'controls', 'preload', 'width', 'height'],
            'video': [...common, 'poster', 'controls', 'preload', 'width', 'height'],
            'source': [...common, 'type', 'src'],
            'track': [...common, 'type', 'src', 'srclang', 'kind', 'label'],
            'tt': [...common],
            'b': [...common],
            'i': [...common],
            'big': [...common],
            'small': [...common],
            'strike': [...common],
            's': [...common],
            'u': [...common],
            'font': [...common, 'size', 'color', 'face'],
            'hr': [...common, 'width'],
            'ruby': [...common],
            'rb': [...common],
            'rp': [...common],
            'rt': [...common],
            'rtc': [...common],
            'math': [...common, 'class', 'style', 'id', 'title'],
            'figure': [...common],
            'figure-inline': [...common],
            'figcaption': [...common],
            'bdi': [...common],
            'data': [...common, 'value'],
            'time': [...common, 'datetime'],
            'mark': [...common],

            // meta and link are only permitted by removeHTMLtags when Microdata
            // is enabled so we don't bother adding a conditional to hide these
            // Also meta and link are only valid in WikiText as Microdata elements
            // (ie: validateTag rejects tags missing the attributes needed for Microdata)
            // So we don't bother including $common attributes that have no purpose.
            'meta': [...common, 'itemprop', 'content'],
            'link': [...common, 'itemprop', 'href', 'title']
        };

        return Sanitizer._whitelist;
    }


    /**
     * Pick apart some CSS and check it for forbidden or unsafe structures.
     *
     * @static
     * @param String value
     * @return String
     */
    static checkCss(value) {
        value = Sanitizer.normalizeCss(value);
        const UTF8_REPLACEMENT = '\xef\xbf\xbd';

        // Reject problematic keywords and control characters
        if(/[\000-\010\013\016-\037\177]/.test(value) || value.indexOf(UTF8_REPLACEMENT) != -1)
            return '/* invalid control char */';
        else if(/expression|filter\s*:|accelerator\s*:|-o-link\s*:|-o-link-source\s*:|-o-replace\s*:|url\s*\(|image\s*\(|image-set\s*\(|attr\s*\([^)]+[\s,]+url var\s*\(/gi.test(value))
            return '/* insecure input */';

        return value;
    }


    /**
     * Normalize CSS into a format we can easily search for hostile input
     *
     * @static
     * @param String value
     * @return String
     */
    static normalizeCss(value) {
        // Decode character references like &#123;
        value = he.decode(value);

        // Decode escape sequences and line continuation
        const space = '[\\x20\\t\\r\\n\\f]';
        const nl = '(?:\\n|\\r\\n|\\r|\\f)';
        const backslash = '\\\\';
        const decodeRegex = new RegExp(`${ backslash }(?:(${ nl })|([0-9A-Fa-f]{1,6})${ space }?|(.)|()|)`, "gu");

        value = value.replace(decodeRegex, (match, a , b) => {
            // 1. Line continuation
            // 2. character number
            // 3. backslash cancelling special meaning
            // 4. backslash at end of string
            let char = '';
            if(match[1] != '') // Line continuation
                return '';
            else if(match[2] != '')
                char = he.decode(`&x${ match[2] };`);
            else if( $matches[3] !== '' )
                char = $matches[3];
            else
                char = '\\';

            if(char == '\n' || char == '"' || char == "'" || char == '\\')
                // These characters need to be escaped in strings
                // Clean up the escape sequence to avoid parsing errors by clients
                return `\\${ char.charCodeAt(0).toString(16) } `;
            else // Decode unnecessary escape
                return char;
        });

        // Remove any comments
        if(value.indexOf('/*') != -1){
            let commentPos = 0;
            while((commentPos = value.indexOf('/*')) != -1) {
                let a = value.indexOf('*/');
                a = a == -1 ? '' : value.substring(a + 2);
                value = value.substring(0, commentPos) + a;
            }
        }

        return value;
    }


    /**
     * Escape string as an HTM5 valid id.
     *
     * @static
     * @param String id
     * @param String [mode='html5']
     * @return String
     */
    static escapeId(id, mode='html5') {
        switch(mode) {
            case 'html5':
                id = id.replace(/ /g, '_');
                break;
            case 'legacy':
                // This corresponds to 'noninitial' mode of the old escapeId()
                id = encodeURIComponent(id.replace(/ /g, '_'));
                id = id.replace(/%3A/g, ':');
                id = id.replace(/%/g, '.');
                break;
            default:
                id = Sanitizer.escapeId(id);
        }

        return id;
    }


    /**
     * Escape list of HTM5 ids.
     *
     * @static
     * @param String referenceString
     * @return String
     */
    static escapeIdReferenceList(referenceString) {
        return referenceString.split(/\s+/)
            .filter(Boolean)
            .map(Sanitizer.escapeId)
            .join(' ');
    }


    /**
     * Cleans up HTML, removes dangerous tags, attributes, and comments.
     * Tags are replaced by entities (ie. &lt;a&gt;).
     *
     * @static
     * @param String text
     * @param Function [processCallback]
     * @param Array [args]
     * @param String[] [extratags]
     * @param String[] [removetags]
     * @return String
     */
    static removeHTMLtags(text, processCallback=null, args=[], extratags=[], removetags=[]) {
        const tagData = Sanitizer.getRecognizedTagData(extratags, removetags);
        const {htmlpairs, htmlsingle, htmlsingleonly, htmlnest, tabletags,
            htmllist, listtags, htmlsingleallowed, htmlelements} = tagData;

        text = Sanitizer.removeHTMLcomments(text);
        const bits = [];

        text.split(/(<)/g).forEach(a => {
            if(bits.length > 0 && bits[bits.length -1] == '<')
                bits[bits.length -1] += a
            else if(a)
                bits.push(a);
        });

        if(bits.length == 0)
            return '';

        text = bits[0][0] == '<' ? '' : bits.shift().replace(/>/g, '&gt;');
        const tagstack = [];
        const tablestack = [];

        bits.forEach(bit => {
            // hack: no possessive quantifiers in JS
            let result = /^<(\/?)([A-Za-z][^\s/>]*?)\s+([^>]*?)(\/?>)([^<]*)$/gi.exec(bit.replace(/(\/)?>/g, ' $1>'));
            if(!result) {
                text += bit.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                return;
            }
            let [, slash, name, attrs, brace, rest] = result;
            // slash: Does the current element start with a '/'?
            // name: Current element name
            // attrs: String between element name and >
            // brace: Ending '>' or '/>'
            // rest: Everything until the next element of $bits

            //console.log(bit, 'slash', slash, 'name', name, 'attrs', attrs, 'brace', brace, 'rest', rest);

            name = name.toLowerCase();
            if(htmlelements.includes(name)) {
                let badtag = false;
                let newparams = '';

                // Check our stack
                if(slash && htmlsingleonly.includes(name))
                    badtag = true;
                else if(slash) {
                    // Closing a tag... is it the one we just opened?
                    let ot = tagstack.pop();
                    if(ot != name) {
                        if(htmlsingleallowed.includes(ot)) {
                            // Pop all elements with an optional close tag
                            // and see if we find a match below them
                            let optstack = [ot];
                            ot = tagstack.pop();

                            while(ot != name && htmlsingleallowed.includes(ot)) {
                                optstack.push(ot);
                                ot = tagstack.pop();
                            }

                            if(ot != name) {
                                // No match. Push the optional elements back again
                                badtag = true;
                                ot = optstack.pop();
                                while(ot) {
                                    tagstack.push(ot);
                                    ot = optstack.pop();
                                }
                            }
                        }
                        else {
                            tagstack.push(ot);

                            // <li> can be nested in <ul> or <ol>, skip those cases:
                            if(!htmllist.includes(ot) || !listtags.includes(ot))
                                badtag = true;
                        }
                    }
                    else if(name == 'table')
                        tagstack = tablestack.pop();
                    newparams = '';
                }
                else {
                    // Keep track for later
                    if(tabletags.includes(name) && !tagstack.includes('table'))
                        badtag = true;
                    else if(tagstack.includes(name) && !htmlnest.includes(name))
                        badtag = true;
                    //  Is it a self closed htmlpair ? (T7487)
                    else if(brace == '/>' && htmlpairs.includes(name))
                        // Eventually we'll just remove the self-closing
                        // slash, in order to be consistent with HTML5
                        // semantics.
                        // $brace = '>';
                        // For now, let's just warn authors to clean up.
                        badtag = true;
                    else if(htmlsingleonly.includes(name))
                        // Hack to force empty tag for unclosable elements
                        brace = '/>';
                    else if(htmlsingle.includes(name)) {
                        // Hack to not close $htmlsingle tags
                        brace = '';
                        // Still need to push this optionally-closed tag to
                        // the tag stack so that we can match end tags
                        // instead of marking them as bad.
                        tagstack.push(name);
                    }
                    else if(tabletags.includes(name) && tagstack.includes(name))
                        // New table tag but forgot to close the previous one
                        text += `</${ name }>`;
                    else {
                        if(name == 'table') {
                            tablestack.push(tagstack); // ?
                            tagstack = [];
                        }
                        tagstack.push(name);
                    }

                    // Replace any variables or template parameters with
                    // plaintext results.
                    if(processCallback)
                        attrs = processCallback.apply(this, [attrs, ...args]);

                    if(!Sanitizer.validateTag(attrs, name))
                        $badtag = true;

                    // Strip non-approved attributes from the tag
                    newparams = Sanitizer.fixTagAttributes(attrs, name);
                }

                if(!badtag) {
                    rest = rest.replace(/>/g, '&gt;');
                    close = (brace == '/>' && slash)? ' /' : '';
                    text += `<${ slash }${ name }${ newparams? ' ' : '' }${ newparams }${ close }>${ rest }`;
                    return;
                }
            }
            text += bit.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        });

        // Close off any remaining tags
        let t = null;
        while(Array.isArray(tagstack) && (t = tagstack.pop())) {
            text += `</${ t }>\n`;
            if(t == 'table')
                tagstack = tablestack.pop();
        }

        return text;
    }


    /**
     * Remove '<!--', '-->', and everything between.
     *
     * @param String text
     * @return String
     */
    static removeHTMLcomments(text) {
        let start = -1;
        while((start = text.indexOf('<!--')) != -1) {
            let end = text.indexOf('-->', start + 4);
            let after = end != -1 ? '\n' + text.substring(end + 3).trimLeft() : '';

            text = text.substring(0, start).trimRight() + after;
        }
        return text;
    }


    /**
     * Return the various lists of recognized tags
     *
     * @param Array extratags
     * @param Array removetags
     * @return Object
     */
    static getRecognizedTagData(extratags=[], removetags=[]) {
        // Tags that must be closed
        const htmlpairsStatic = [
            'b', 'bdi', 'del', 'i', 'ins', 'u', 'font', 'big', 'small', 'sub',
            'sup', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'cite', 'code', 'em',
            's', 'strike', 'strong', 'tt', 'var', 'div', 'center', 'blockquote',
            'ol', 'ul', 'dl', 'table', 'caption', 'pre', 'ruby', 'rb', 'rp',
            'rt', 'rtc', 'p', 'span', 'abbr', 'dfn', 'kbd', 'samp', 'data',
            'time', 'mark'
        ];
        const htmlsingle = [
            'br', 'wbr', 'hr', 'li', 'dt', 'dd', 'meta', 'link', 'img'
        ];

        // Elements that cannot have close tags.
        const htmlsingleonly = [
            'br', 'wbr', 'hr', 'meta', 'link', 'img'
        ];

        // Tags that can be nested--??
        const htmlnest = [
            'table', 'tr', 'td', 'th', 'div', 'blockquote', 'ol', 'ul',
            'li', 'dl', 'dt', 'dd', 'font', 'big', 'small', 'sub', 'sup',
            'span', 'var', 'kbd', 'samp', 'em', 'strong', 'q', 'ruby', 'bdo'
        ];

        // Can only appear inside table, we will close them
        const tabletags = [
            'td', 'th', 'tr',
        ];

        // Tags used by list
        const htmllist = [
            'ul', 'ol',
        ];

        // Tags that can appear in a list
        const listtags = [
            'li',
        ];

        const htmlsingleallowed = Array.from(new Set([...htmlsingle, ...tabletags]));
        const htmlelementsStatic = Array.from(new Set([...htmlsingle, ...htmlpairsStatic, ...htmlnest]));

        // Populate htmlpairs and htmlelements with the extratags and removetags arrays
        const htmlpairs = [...extratags, ...htmlpairsStatic];
        const htmlelements = [...extratags, ...htmlelementsStatic].filter(a => !removetags.includes(a))

        return {
            htmlpairs: htmlpairs,
            htmlsingle: htmlsingle,
            htmlsingleonly: htmlsingleonly,
            htmlnest: htmlnest,
            tabletags: tabletags,
            htmllist: htmllist,
            listtags: listtags,
            htmlsingleallowed: htmlsingleallowed,
            htmlelements: htmlelements
        };
    }


    /**
     * Validate tags meta and link in some special cases
     *
     * @param String params
     * @param String element
     * @return bool
     */
    static validateTag(params, element) {
        params = Sanitizer.decodeTagAttributes(params);

        if(element == 'meta' || element == 'link') {
            if(!params['itemprop'])
                // <meta> and <link> must have an itemprop="" otherwise they are not valid or safe in content
                return false;
            if(element == 'meta' && !params['content'])
                // <meta> must have a content="" for the itemprop
                return false;
            if(element == 'link' && !params['href'])
                // <link> must have an associated href=""
                return false;
        }
        return true;
    }


    /**
     * Decode any character references, numeric or named entities,
     * in the next and normalize the resulting string. (T16952)
     *
     * This is useful for page titles, not for text to be displayed,
     * MediaWiki allows HTML entities to escape normalization as a feature.
     *
     * @param string $text Already normalized, containing entities
     * @return string Still normalized, without entities
     */
    static decodeCharReferencesAndNormalize(text) {
        return he.decode(text); // FIXME
        // MediaWikiServices::getInstance()->getContentLanguage()->normalize( $text );
    }


    /**
     * Simple escape HTML entities
     */
    static escapeHTML(unsafe) {
        return unsafe.replace(/[&<>"']/g, function(m) {
            switch (m) {
                case '&':
                    return '&amp;';
                case '<':
                    return '&lt;';
                case '>':
                    return '&gt;';
                case '"':
                    return '&quot;';
                default:
                    return '&#039;';
            }
        });
    }


    /**
     * Take a fragment of (potentially invalid) HTML and return
     * a version with any tags removed, encoded as plain text.
     *
     * @param String html
     * @return string
     */
    static stripAllTags(html) {
        const bits = [];
        html.split(/(<)/g).forEach(a => {
            if(bits.length > 0 && bits[bits.length -1] == '<')
                bits[bits.length -1] += a
            else if(a)
                bits.push(a);
        });

        return bits.map(bit => {
            if(!bit)
                return '';

            if(bit[0] == '<' && bit.indexOf('>') != -1)
                return Sanitizer.escapeHTML(bit.substring(bit.indexOf('>') + 1));
            return Sanitizer.escapeHTML(bit);
        }).join('');
    }


    /**
     * Escapes the given text so that it may be output using addWikiText()
     * without any linking, formatting, etc. making its way through. This
     * is achieved by substituting certain characters with HTML entities.
     * As required by the callers, "<nowiki>" is not used.
     *
     * @param String Text
     * @return String
     */
    static escapeWikiText(text) {
        const repl = [
            [/;/g, '&#59;'],
            [/"/g, '&#34;'],
            [/&/g, '&#38;'],
            [/'/g, '&#39;'],
            [/</g, '&#60;'],
            [/=/g, '&#61;'],
            [/>/g, '&#62;'],
            [/\[/g, '&#91;'],
            [/\]/g, '&#93;'],
            [/\{/g, '&#123;'],
            [/\|/g, '&#124;'],
            [/\}/g, '&#125;'],
            [/\n#/g, '\n&#35;'],
            [/\r#/g, '\r&#35;'],
            [/\n\*/g, '\n&#42;'],
            [/\r\*/g, '\r&#42;'],
            [/\n:/g, '\n&#58;'],
            [/\r:/g, '\r&#58;'],
            [/\n /g, '\n&#32;'],
            [/\r /g, '\r&#32;'],
            [/\n\n/g, '\n&#10;'],
            [/\r\n/g, '&#13;\n'],
            [/\n\r/g, '\n&#13;'],
            [/\r\r/g, '\r&#13;'],
            [/\n\t/g, '\n&#9;'],
            [/\r\t/g, '\r&#9;'], // '\n\t\n" is treated like '\n\n"
            [/\n----/g, '\n&#45;---'],
            [/\r----/g, '\r&#45;---'],
            [/__/g, '_&#95;'],
            [/:\/\//g, '&#58;//']
        ];
        text = repl.reduce((txt, [from, to]) => txt.replace(from, to), text);

        text = Sanitizer.protocolSchemes()
            .filter(prot => prot.endsWith(':'))
            .map(prot => ([new RegExp(prot, 'ig'), prot.replace(':', '&#58;')]))
            .reduce((txt, [from, to]) => txt.replace(from, to), text);

        return text;
    }


    /**
     * Defends against the sanitization of tags and URLs
     *
     * @param String text
     * @return String
     */
    static armorHtmlAndLinks(text) {
        const MARKER = '\x7f\'"`UNIQ-%1-QINU`"\'\x7f';

        let repl = Sanitizer.protocolSchemes()
            .filter(prot => prot.indexOf(':') != -1)
            .map(prot => [
                new RegExp('\\b' + prot.replace('//', '\\/\\/'), 'gi'),
                MARKER.replace('%1', prot.replace(/:\/?\/?/, ''))
            ]);
        repl.push(
            [/</g, MARKER.replace('%1', 'lt')],
            [/>/g, MARKER.replace('%1', 'gt')]
        );

        return repl.reduce((txt, [from, to]) => txt.replace(from, to), text);
    }


    /**
     * Reverses the function Sanitizer.armorHtmlAndLinks()
     *
     * @param String text
     * @return String
     */
    static unarmorHtmlAndLinks(text) {
        const MARKER = '\x7f\'"`UNIQ-%1-QINU`"\'\x7f';

        let repl = Sanitizer.protocolSchemes()
            .filter(prot => prot.indexOf(':') != -1)
            .map(prot => [
                new RegExp(MARKER.replace('%1', prot.replace(/:\/?\/?/, '')), 'g'),
                prot
            ]);
        repl.push(
            [new RegExp(MARKER.replace('%1', 'lt'), 'g'), '<'],
            [new RegExp(MARKER.replace('%1', 'gt'), 'g'), '>']
        );

        return repl.reduce((txt, [from, to]) => txt.replace(from, to), text);
    }


    /**
     * Check if string has arored HTML / URLs
     *
     * @param String text
     * @return Boolean
     */
    static isStringArmored(text) {
        return /\x7f'"`UNIQ-.*?-QINU`"'\x7f/.test(text);
    }
};
