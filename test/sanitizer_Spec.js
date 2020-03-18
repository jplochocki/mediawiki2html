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
    });

    it('single quote i no quote args', function() {
        let result = Sanitizer.decodeTagAttributes(`single_quote='  luctus cursus risus  ' no_quote=lorem no_value`);
        expect(result).toEqual({
            single_quote: 'luctus cursus risus',
            no_quote: 'lorem',
            no_value: ''
        });
    });

    it('upper case names to lower case', function() {
        let result = Sanitizer.decodeTagAttributes(`UPPER_CASE_NAME="lorem"`);
        expect(result).toEqual({
            upper_case_name: 'lorem'
        });
    });

    it('invalid args names should not pass', function() {
        let result = Sanitizer.decodeTagAttributes(`invalid_name*='luctus cursus risus'`);
        expect(result).toEqual({
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
    });

    it('xml namespaces should pass', function() {
        let result = Sanitizer.validateTagAttributes({
            'xmlns:lorem': 'ipsum',
            'xmlns:ipsum': 'javascript:',
            'xmlns:dolor': 'vbscript:',
        }, 'tr');
        expect(result).toEqual({
            'xmlns:lorem': 'ipsum',
        });
    });

    it('only valid data attrs should pass', function() {
        let result = Sanitizer.validateTagAttributes({
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
    beforeAll(function() {
        this.whitelist = Sanitizer.attributeWhitelistInternal('tr');
    });

    it('basic tests', function() {
        let result = Sanitizer.validateAttributes({
            class: 'wikitable',
            style: 'width: 100%;'
        }, this.whitelist);
        expect(result).toEqual({
            class: 'wikitable',
            style: 'width: 100%;'
        });
    });

    it('xml namespaces should pass', function() {
        let result = Sanitizer.validateAttributes({
            'xmlns:lorem': 'ipsum',
            'xmlns:ipsum': 'javascript:',
            'xmlns:dolor': 'vbscript:',
        }, this.whitelist);
        expect(result).toEqual({
            'xmlns:lorem': 'ipsum',
        });
    });

    it('MW restricted data attrs should not pass', function() {
        let result = Sanitizer.validateAttributes({
            'data-lorem': 'ipsum',
            'data-ooui': 'lorem ipsum',
            'data-mw': 'lorem ipsum',
            'data-parsoid': 'lorem ipsum',
        }, this.whitelist);
        expect(result).toEqual({
            'data-lorem': 'ipsum',
        });
    });

    it('only known URI protocols should pass', function() {
        let result = Sanitizer.validateAttributes({
            'id': 'tes id - aaa',
            'style': 'width: 100%; ',
            'href': 'http://lorem.ipsum.com',
            'src': 'lorem://lorem.ipsum.com'
        }, [...this.whitelist, 'href', 'src']);
        expect(result).toEqual({
            id: 'tes_id_-_aaa',
            style: 'width: 100%; ',
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
    it('sqould replace entities', function() {
        let result = Sanitizer.normalizeCss('&amp;');
        expect(result).toEqual('&');
    });

    it('should cut some chars', function() {
        let result = Sanitizer.normalizeCss('\\n\\"\\\'\\');
        expect(result).toEqual('');
    });

    it('should not pass comments', function() {
        let result = Sanitizer.normalizeCss('width: /* lorem ipsum */ 100%');
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


describe('Test Sanitizer.removeHTMLtags()', function() {
    it('div with params should pass', function() {
        let result = Sanitizer.removeHTMLtags(`Lorem ipsum <div style="width: 100%;" class='single quote'>dolor sit</div>amet`);
        expect(result).toEqual('Lorem ipsum <div style="width: 100%;" class="single quote">dolor sit</div>amet');
    });

    it('invalid / dangerous params should not pass', function() {
        let result = Sanitizer.removeHTMLtags(`<div loremparam="lorem ipsum" onclick="javascript:alert('aaa')">dolor sit</div>`);
        expect(result).toEqual('<div>dolor sit</div>');
    });

    it('div without end should be ended', function() {
        let result = Sanitizer.removeHTMLtags(`Lorem ipsum <div>dolor sit amet`);
        expect(result).toEqual('Lorem ipsum <div>dolor sit amet</div>\n');
    });

    it('a tag should not pass', function() {
        let result = Sanitizer.removeHTMLtags(`Lorem ipsum <a href="http://lorem.com">dolor</a> sit amet`);
        expect(result).toEqual('Lorem ipsum &lt;a href="http://lorem.com"&gt;dolor&lt;/a&gt; sit amet');
    });

    it('cdata section should not pass', function() {
        let result = Sanitizer.removeHTMLtags(`Lorem ipsum <![CDATA[dolor]]> sit amet`);
        expect(result).toEqual('Lorem ipsum &lt;![CDATA[dolor]]&gt; sit amet');
    });

    it('end tag without opening tag should not pass', function() {
        let result = Sanitizer.removeHTMLtags(`Lorem ipsum </div> sit amet`);
        expect(result).toEqual('Lorem ipsum &lt;/div&gt; sit amet');
    });

    it('invalid close tag', function() {
        let result = Sanitizer.removeHTMLtags('<hr></hr>');
        expect(result).toEqual('<hr>&lt;/hr&gt;');
    });
});


describe('Test Sanitizer.removeHTMLcomments()', function() {
    it('basic tests', function() {
        let result = Sanitizer.removeHTMLcomments('Lorem ipsum <!--dolor sit amet-->, consectetur adipiscing <!--elit');
        expect(result).toEqual('Lorem ipsum\n, consectetur adipiscing');
    });
});


describe('Test Sanitizer.getRecognizedTagData()', function() {
    it('basic tests', function() {
        let result = Sanitizer.getRecognizedTagData();
        expect(result).toEqual(jasmine.any(Object));
    });
});


describe('Test Sanitizer.validateTag()', function() {
    it('valid meta and link tags', function() {
        let result = Sanitizer.validateTag("itemprop='lorem' content='ipsum'", 'meta');
        expect(result).toBeTruthy();

        result = Sanitizer.validateTag("itemprop='lorem' href='ipsum'", 'link');
        expect(result).toBeTruthy();
    });

    it('invalid meta and link tags', function() {
        let result = Sanitizer.validateTag("lorem='ipsum'", 'meta');
        expect(result).toBeFalsy();

        result = Sanitizer.validateTag("lorem='ipsum'", 'link');
        expect(result).toBeFalsy();
    });
});


describe('Test Sanitizer.stripAllTags()', function() {
    it('basic tests', function() {
        let r = Sanitizer.stripAllTags('Lorem <div>Lorem ipsum</div> dolor')
        expect(r).toEqual('Lorem Lorem ipsum dolor');

        r = Sanitizer.stripAllTags('Lorem <div>Lorem ipsum</div>> dolor<')
        expect(r).toEqual('Lorem Lorem ipsum&gt; dolor&lt;');
    });
});


describe('tests Sanitizer.escapeWikiText()', function() {
    it('basic tests', function() {
        let result = Sanitizer.escapeWikiText('Lorem \'\'\'ipsum\'\'\' dolor <b>sit<i>amet</i></b>.');
        expect(result).toEqual('Lorem &#39;&#39;&#39;ipsum&#39;&#39;&#39; dolor &#60;b&#62;sit&#60;i&#62;amet&#60;/i&#62;&#60;/b&#62;.');

        result = Sanitizer.escapeWikiText('Lorem https://lorem.ipsum.com/dorol sit amet.');
        expect(result).toEqual('Lorem https&#58;//lorem.ipsum.com/dorol sit amet.');
    });
});


describe('tests Sanitizer.armorHtmlAndLinks() and Sanitizer.unarmorHtmlAndLinks()', function() {
    it('basic tests', function() {
        const src = 'lorem <ipsum> dolor. https://lorem.ipsum.com dolor sit amet';
        let result = Sanitizer.armorHtmlAndLinks(src);
        expect(result).toEqual('lorem \x7f\'"`UNIQ-lt-QINU`"\'\x7fipsum\x7f\'"`UNIQ-gt-QINU`"\'\x7f dolor. \x7f\'"`UNIQ-https-QINU`"\'\x7florem.ipsum.com dolor sit amet');
        result = Sanitizer.unarmorHtmlAndLinks(result);
        expect(result).toEqual(src);
    });
});


describe('tests Sanitizer.isStringArmored()', function() {
    it('basic tests', function() {
        const src = 'lorem <ipsum> dolor. https://lorem.ipsum.com dolor sit amet';
        let result = Sanitizer.armorHtmlAndLinks(src);

        expect(Sanitizer.isStringArmored(result)).toBeTruthy();
        expect(Sanitizer.isStringArmored(src)).toBeFalsy();
    });
});
