/**
 * Tests for src/sanitizer.js.
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

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
describe('Test Sanitizer.fixTagAttributes', function() {
    it('basic tests', function() {
        let result = Sanitizer.fixTagAttributes(`class="wikitable" STYLE="width: 100%;" onclick="alert('should be deleted')"`, 'tr');
        expect(result).toEqual('class="wikitable" style="width: 100%;"');

    });
});


describe('Test Sanitizer.decodeTagAttributes', function() {
    it('basic tests', function() {
        let result = Sanitizer.decodeTagAttributes(`class="wikitable" style="width: 100%;"`);
        expect(result).toEqual({
            class: 'wikitable',
            style: 'width: 100%;'
        });

        result = Sanitizer.decodeTagAttributes(`single_quote='  luctus cursus risus  ' no_quote=lorem no_value`);
        expect(result).toEqual({
            single_quote: 'luctus cursus risus',
            no_quote: 'lorem',
            no_value: ''
        });

        result = Sanitizer.decodeTagAttributes(`invalid_name*='luctus cursus risus' UPPER_CASE_NAME="lorem"`);
        expect(result).toEqual({
            upper_case_name: 'lorem'
        });
    });
});


describe('Test Sanitizer.safeEncodeTagAttributes', function() {
    it('basic tests', function() {
        let result = Sanitizer.safeEncodeTagAttributes({
            style: 'width: 100%;',
            class: 'wikitable'
        }, true);

        expect(result).toEqual(`class="wikitable" style="width: 100%;"`);
    });
});


describe('Test Sanitizer.getAttribsRegex', function() {
    it('basic tests', function() {
        let result = Sanitizer.getAttribsRegex();
        expect(result).toEqual(jasmine.any(RegExp));
    });
});


describe('Test Sanitizer.getAttribNameRegex', function() {
    it('basic tests', function() {
        let result = Sanitizer.getAttribNameRegex();
        expect(result).toEqual(jasmine.any(RegExp));
    });
});


describe('Test Sanitizer.validateTagAttributes()', function() {
    it('basic tests', function() {
        let result = Sanitizer.validateTagAttributes({
            class: 'wikitable',
            style: 'width: 100%;'
        }, 'tr');
        expect(result).toEqual({
            class: 'wikitable',
            style: 'width: 100%;'
        });

        result = Sanitizer.validateTagAttributes({
            'xmlns:lorem': 'ipsum',
            'xmlns:ipsum': 'javascript:',
            'xmlns:dolor': 'vbscript:',
        }, 'tr');
        expect(result).toEqual({
            'xmlns:lorem': 'ipsum',
        });

        result = Sanitizer.validateTagAttributes({
            'data-lorem': 'ipsum',
            'data-ooui': 'lorem ipsum',
            'data-mw': 'lorem ipsum',
            'data-parsoid': 'lorem ipsum',
        }, 'tr');
        expect(result).toEqual({
            'data-lorem': 'ipsum',
        });
    });
});


describe('Test Sanitizer.validateAttributes()', function() {
    it('basic tests', function() {
        const whitelist = Sanitizer.attributeWhitelistInternal('tr');
        let result = Sanitizer.validateAttributes({
            class: 'wikitable',
            style: 'width: 100%;'
        }, whitelist);
        expect(result).toEqual({
            class: 'wikitable',
            style: 'width: 100%;'
        });

        result = Sanitizer.validateAttributes({
            'xmlns:lorem': 'ipsum',
            'xmlns:ipsum': 'javascript:',
            'xmlns:dolor': 'vbscript:',
        }, whitelist);
        expect(result).toEqual({
            'xmlns:lorem': 'ipsum',
        });

        result = Sanitizer.validateAttributes({
            'data-lorem': 'ipsum',
            'data-ooui': 'lorem ipsum',
            'data-mw': 'lorem ipsum',
            'data-parsoid': 'lorem ipsum',
        }, whitelist);
        expect(result).toEqual({
            'data-lorem': 'ipsum',
        });

        result = Sanitizer.validateAttributes({
            'id': 'tes id - aaa',
            'style': ' width: 100%; ',
            'href': 'http://lorem.ipsum.com',
            'src': 'lorem://lorem.ipsum.com'
        }, [...whitelist, 'href', 'src']);
        expect(result).toEqual({
            id: 'tes_id_-_aaa',
            style: ' width: 100%; ',
            href: 'http://lorem.ipsum.com'
        });
    });
});


describe('Test Sanitizer.attributeWhitelistInternal', function() {
    it('basic tests', function() {
        let result = Sanitizer.attributeWhitelistInternal('tr');
        expect(result).toEqual(['id', 'class', 'style', 'lang', 'dir', 'title',
            'aria-describedby', 'aria-flowto', 'aria-label', 'aria-labelledby',
            'aria-owns', 'role', 'about', 'property', 'resource', 'datatype',
            'typeof', 'itemid', 'itemprop', 'itemref', 'itemscope', 'itemtype',
            'bgcolor', 'align', 'valign']);

        result = Sanitizer.attributeWhitelistInternal('lorem ipsum unknown tag');
        expect(result).toEqual([]);
    });
});


describe('Test Sanitizer.setupAttributeWhitelistInternal()', function() {
    it('basic tests', function() {
        let result = Sanitizer.setupAttributeWhitelistInternal();

        expect(result).toEqual(jasmine.any(Object));
        expect(result['tr']).toEqual(['id', 'class', 'style', 'lang', 'dir', 'title',
            'aria-describedby', 'aria-flowto', 'aria-label', 'aria-labelledby',
            'aria-owns', 'role', 'about', 'property', 'resource', 'datatype',
            'typeof', 'itemid', 'itemprop', 'itemref', 'itemscope', 'itemtype',
            'bgcolor', 'align', 'valign']);
    });
});


describe('Test Sanitizer.checkCss()', function() {
    it('basic tests', function() {
        let result = Sanitizer.checkCss('\xef\xbf\xbd')
        expect(result).toEqual('/* invalid control char */');

        result = Sanitizer.checkCss("expression: lorem;")
        expect(result).toEqual('/* insecure input */');
    });
});


describe('Test Sanitizer.normalizeCss()', function() {
    it('basic tests', function() {
        let result = Sanitizer.normalizeCss('&amp;');
        expect(result).toEqual('&');

        result = Sanitizer.normalizeCss('\\n\\"\\\'\\');
        expect(result).toEqual('');

        result = Sanitizer.normalizeCss('width: /* lorem ipsum */ 100%');
        expect(result).toEqual('width:  100%');
    });
});


describe('Test Sanitizer.escapeId()', function() {
    it('basic tests', function() {
        let result = Sanitizer.escapeId('Lorem ipsum dolor sit');
        expect(result).toEqual('Lorem_ipsum_dolor_sit');
    });
});


describe('Test Sanitizer.escapeIdReferenceList()', function() {
    it('basic tests', function() {
        let result = Sanitizer.escapeIdReferenceList('Lorem ipsum dolor sit');
        expect(result).toEqual('Lorem ipsum dolor sit');
    });
});
