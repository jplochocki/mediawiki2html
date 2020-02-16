/**
 * Tests for src/mwparser.js.
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


describe('Testy handleTables()', function() {
    beforeEach(function() {
    });

    it('...', function() {
        const testTable = `
{|class="wikitable" style="width: 100%;"
|aaa
|bbb
|ccc
|-
|aaa2
|bbb2
|ccc2
|}
        `
        const par = new MWParser();
        const out = par.handleTables(testTable);

    });

    afterEach(function() {
    });
});


describe('Test MWParser.handleInternalLinks()', function() {
    it('standard link tests', function() {
        let par = new MWParser();
        let result = par.handleInternalLinks(`Lorem [[Lorem:ipsum]] dolor`);

        expect(result).toEqual('Lorem <a title="Lorem:ipsum" href="//en.wikipedia.org/w/index.php?title=Lorem%3Aipsum">Lorem:ipsum</a> dolor');
        expect(par.internalLinks.length).toEqual(1);
        expect(par.internalLinks[0] instanceof Title).toBeTruthy();
        expect(Title.newFromText('Lorem:ipsum').equals(par.internalLinks[0])).toBeTruthy();

        par = new MWParser();
        result = par.handleInternalLinks(`Lorem [[Lorem:ipsum|Lorem ipsum]] dolor`);

        expect(result).toEqual('Lorem <a title="Lorem:ipsum" href="//en.wikipedia.org/w/index.php?title=Lorem%3Aipsum">Lorem ipsum</a> dolor');
        expect(par.internalLinks.length).toEqual(1);
        expect(par.internalLinks[0] instanceof Title).toBeTruthy();
        expect(Title.newFromText('Lorem:ipsum').equals(par.internalLinks[0])).toBeTruthy();
    });

    it('standard link with suffix test', function() {
        let par = new MWParser();
        let result = par.handleInternalLinks(`Lorem [[Lorem:ipsum]]amet dolor`);

        expect(result).toEqual('Lorem <a title="Lorem:ipsum" href="//en.wikipedia.org/w/index.php?title=Lorem%3Aipsum">Lorem:ipsumamet</a> dolor');
        expect(par.internalLinks.length).toEqual(1);
        expect(par.internalLinks[0] instanceof Title).toBeTruthy();
        expect(Title.newFromText('Lorem:ipsum').equals(par.internalLinks[0])).toBeTruthy();

        par = new MWParser();
        result = par.handleInternalLinks(`Lorem [[Lorem:ipsum|Lorem ipsum dolor]]amet dolor`);

        expect(result).toEqual('Lorem <a title="Lorem:ipsum" href="//en.wikipedia.org/w/index.php?title=Lorem%3Aipsum">Lorem ipsum doloramet</a> dolor');
        expect(par.internalLinks.length).toEqual(1);
        expect(par.internalLinks[0] instanceof Title).toBeTruthy();
        expect(Title.newFromText('Lorem:ipsum').equals(par.internalLinks[0])).toBeTruthy();
    });

    it('interwiki link tests', function() {
        const cfg = {
            validInterwikiNames: ['pl']
        };
        let par = new MWParser(cfg);
        let result = par.handleInternalLinks(`Lorem [[Lorem:ipsum]] dolor. Maecenas [[pl:sagittis:libero]] eget ante venenatis`);

        expect(result).toEqual(
            'Lorem <a title="Lorem:ipsum" href="//en.wikipedia.org/w/index.php?title=Lorem%3Aipsum">Lorem:ipsum</a> dolor. '
            + 'Maecenas <a title="pl:Sagittis:libero" href="//pl.wikipedia.org/w/index.php?title=Sagittis%3Alibero">pl:sagittis:libero</a> eget ante venenatis');
        expect(par.internalLinks.length).toEqual(1);
        expect(par.internalLinks[0] instanceof Title).toBeTruthy();
        expect(Title.newFromText('Lorem:ipsum').equals(par.internalLinks[0])).toBeTruthy();

        expect(par.interwikiLinks.length).toEqual(1);
        expect(par.interwikiLinks[0] instanceof Title).toBeTruthy();
        expect(Title.newFromText('pl:sagittis:libero', cfg).equals(par.interwikiLinks[0])).toBeTruthy();

        par = new MWParser(cfg);
        result = par.handleInternalLinks(`Lorem [[pl:Lorem:ipsum|Lorem ipsum]] dolor`);

        expect(result).toEqual('Lorem <a title="pl:Lorem:ipsum" href="//pl.wikipedia.org/w/index.php?title=Lorem%3Aipsum">Lorem ipsum</a> dolor');
        expect(par.internalLinks.length).toEqual(0);

        expect(par.interwikiLinks.length).toEqual(1);
        expect(par.interwikiLinks[0] instanceof Title).toBeTruthy();
        expect(Title.newFromText('pl:Lorem:ipsum', cfg).equals(par.interwikiLinks[0])).toBeTruthy();
    });

    it('interwiki link with suffix test', function() {
        const cfg = {
            validInterwikiNames: ['pl']
        };
        let par = new MWParser(cfg);
        let result = par.handleInternalLinks(`Lorem [[pl:Lorem:ipsum]]amet dolor`);

        expect(result).toEqual('Lorem <a title="pl:Lorem:ipsum" href="//pl.wikipedia.org/w/index.php?title=Lorem%3Aipsum">pl:Lorem:ipsumamet</a> dolor');
        expect(par.internalLinks.length).toEqual(0);
        expect(par.interwikiLinks.length).toEqual(1);
        expect(par.interwikiLinks[0] instanceof Title).toBeTruthy();
        expect(Title.newFromText('pl:Lorem:ipsum', cfg).equals(par.interwikiLinks[0])).toBeTruthy();

        par = new MWParser(cfg);
        result = par.handleInternalLinks(`Lorem [[pl:Lorem:ipsum|Lorem ipsum dolor]]amet dolor`);

        expect(result).toEqual('Lorem <a title="pl:Lorem:ipsum" href="//pl.wikipedia.org/w/index.php?title=Lorem%3Aipsum">Lorem ipsum doloramet</a> dolor');
        expect(par.internalLinks.length).toEqual(0);
        expect(par.interwikiLinks.length).toEqual(1);
        expect(par.interwikiLinks[0] instanceof Title).toBeTruthy();
        expect(Title.newFromText('pl:Lorem:ipsum', cfg).equals(par.interwikiLinks[0])).toBeTruthy();
    });

    it('cetegory links', function() {
        let par = new MWParser();
        let result = par.handleInternalLinks(`Lorem ipsum dolor sit amet. [[Category:LoremIpsum]] lorem ipsum.`);

        expect(result).toEqual('Lorem ipsum dolor sit amet. lorem ipsum.');
        expect(par.internalLinks.length).toEqual(0);
        expect(par.interwikiLinks.length).toEqual(0);
        expect(par.categories.length).toEqual(1);

        expect(par.categories[0].title.mNamespace).toEqual(Title.NS_CATEGORY);
        expect(par.categories[0].sortkey).toEqual('');
        expect(Title.newFromText('Category:LoremIpsum').equals(par.categories[0].title)).toBeTruthy();


        par = new MWParser();
        result = par.handleInternalLinks(`Lorem ipsum dolor sit amet. [[Category:LoremIpsum|lorem]] lorem ipsum.`);

        expect(result).toEqual('Lorem ipsum dolor sit amet. lorem ipsum.');
        expect(par.internalLinks.length).toEqual(0);
        expect(par.interwikiLinks.length).toEqual(0);
        expect(par.categories.length).toEqual(1);

        expect(par.categories[0].title.mNamespace).toEqual(Title.NS_CATEGORY);
        expect(par.categories[0].sortkey).toEqual('lorem');
        expect(Title.newFromText('Category:LoremIpsum').equals(par.categories[0].title)).toBeTruthy();
    });

    it('prefix test', function() {
        let par = new MWParser({
            useLinkPrefixExtension: true
        });
        let result = par.handleInternalLinks(
            `Lorem ipsum amet[[Lorem:ipsum]]dolor ipsum bamet[[Lorem:ipsum|ipsum]]dolor ipsum2.`);
        expect(result).toEqual(
            'Lorem ipsum <a title="Lorem:ipsum" href="//en.wikipedia.org/w/index.php?title=Lorem%3Aipsum">ametLorem:ipsumdolor</a> '
            + 'ipsum <a title="Lorem:ipsum" href="//en.wikipedia.org/w/index.php?title=Lorem%3Aipsum">bametipsumdolor</a> ipsum2.');
    });

    it('image link with external link', function() {
        let par = new MWParser();
        let result = par.handleInternalLinks('Lorem [[File:LoremIpsum.jpg|[http://example.com dolor]]] sit amet.');
        // FIXME - should drop external link; alt=dolor
    });

    it('broken link', function() {
        let par = new MWParser();
        const a = 'Lorem [[File:LoremIpsum.jpg|dolor sit amet';
        let result = par.handleInternalLinks(a);
        expect(result).toEqual(a);
    });
});


describe('Test Parser.makeLinkObj', function() {
    it('basic tests', function() {
        const par = new MWParser();
        let t = Title.newFromText('lorem:ipsum');
        expect(par.makeLinkObj(t)).toEqual('<a title="Lorem:ipsum" href="//en.wikipedia.org/w/index.php?title=Lorem%3Aipsum">Lorem:ipsum</a>');


        let r = par.makeLinkObj(t, 'link title', {foo: 'bar'}, 'trail rest of text', 'prefix')
        expect(r).toEqual(
            '<a title="Lorem:ipsum" href="//en.wikipedia.org/w/index.php?title=Lorem%3Aipsum&foo=bar">prefixlink titletrail</a> rest of text');
    });
});


describe('Test MWParser.matchImageVariable', function() {
    it('basic tests', function() {
        const par = new MWParser();
        const lorem = 'lorem ipsum dolor';
        Object.entries(par.parserConfig.magicWords).forEach(([wordName, values]) => {
            values.forEach(val => {
                let r = par.matchImageVariable(val.replace(/\$1/g, lorem))
                expect(r.magicName).toEqual(wordName);
                if(/\$1/g.test(val))
                    expect(r.value).toEqual(lorem);
                else
                    expect(r.value).toEqual(false);
            });
        });

    });
});


describe('Test MWParser.parseLinkParameterPrivate', function() {
    it('basic tests', function() {
        const par = new MWParser();
        const url = 'https://lorem.ipsum.com/dolor?sit=amet';
        let r = par.parseLinkParameterPrivate(url);
        expect(par.externalLinks.length).toEqual(1);
        expect(par.externalLinks[0]).toEqual(url);
        expect(r.type).toEqual('link-url');
        expect(r.value).toEqual(url);

        const title = 'Lorem:ipsum', nt = Title.newFromText(title);
        r = par.parseLinkParameterPrivate(title);
        expect(par.internalLinks.length).toEqual(1);
        expect(nt.equals(par.internalLinks[0])).toBeTruthy();
        expect(r.type).toEqual('link-title');
        expect(nt.equals(r.value)).toBeTruthy();

        r = par.parseLinkParameterPrivate('');
        expect(r.type).toEqual('no-link');
        expect(r.value).toEqual(false);
    });
});


describe('Test MWParser.makeImage', function() {
    beforeEach(function() {
        this.parser = new MWParser();
        this.title = Title.newFromText('File:dolor.png', this.parser.parserConfig);
        spyOn(this.parser, 'makeImageHTML');
    });

    it('width and height tests', function() {
        this.parser.makeImage(this.title, '150px');
        expect(this.parser.makeImageHTML).toHaveBeenCalled();
        let [title, params_frame, params_handler] = this.parser.makeImageHTML.calls.argsFor(0);
        expect(title.equals(this.title)).toBeTruthy();
        expect(params_handler).toEqual({width: 150});
        expect(params_frame).toEqual({caption: '', alt: 'Dolor.png', title: '', align: '', 'class': ''});

        this.parser.makeImage(this.title, 'x150px');
        expect(this.parser.makeImageHTML).toHaveBeenCalled();
        ([title, params_frame, params_handler] = this.parser.makeImageHTML.calls.argsFor(1));
        expect(title.equals(this.title)).toBeTruthy();
        expect(params_handler).toEqual({height: 150});
        expect(params_frame).toEqual({caption: '', alt: 'Dolor.png', title: '', align: '', 'class': ''});

        this.parser.makeImage(this.title, '300x150px');
        expect(this.parser.makeImageHTML).toHaveBeenCalled();
        ([title, params_frame, params_handler] = this.parser.makeImageHTML.calls.argsFor(2));
        expect(title.equals(this.title)).toBeTruthy();
        expect(params_handler).toEqual({width: 300, height: 150});
        expect(params_frame).toEqual({caption: '', alt: 'Dolor.png', title: '', align: '', 'class': ''});

        // with caption
        this.parser.makeImage(this.title, '300x150px|lorem ipsum dolor');
        expect(this.parser.makeImageHTML).toHaveBeenCalled();
        ([title, params_frame, params_handler] = this.parser.makeImageHTML.calls.argsFor(3));
        expect(title.equals(this.title)).toBeTruthy();
        expect(params_handler).toEqual({width: 300, height: 150});
        expect(params_frame).toEqual({caption: 'lorem ipsum dolor', alt: 'lorem ipsum dolor', title: 'lorem ipsum dolor', align: '', 'class': ''});
    });

    it('horizontal align tests', function() {
        ['left', 'right', 'center', 'none'].forEach((t, idx) => {
            this.parser.makeImage(this.title, t);
            expect(this.parser.makeImageHTML).toHaveBeenCalled();
            let [title, params_frame, params_handler] = this.parser.makeImageHTML.calls.argsFor(idx);
            expect(title.equals(this.title)).toBeTruthy();
            expect(params_handler).toEqual({});
            expect(params_frame).toEqual({align: t, caption: '', alt: 'Dolor.png', title: '', 'class': ''});
        });
    });

    it('should not be align', function() {
        this.parser.makeImage(this.title, 'center lorem ipsum');
        expect(this.parser.makeImageHTML).toHaveBeenCalled();
        let [title, params_frame, params_handler] = this.parser.makeImageHTML.calls.argsFor(this.parser.makeImageHTML.calls.count() -1);
        expect(title.equals(this.title)).toBeTruthy();
        expect(params_handler).toEqual({});
        expect(params_frame).toEqual({caption: 'center lorem ipsum', alt: 'center lorem ipsum', title: 'center lorem ipsum', align: '', 'class': ''});
    });

    it('first align matters', function() {
        this.parser.makeImage(this.title, 'left|right|center');
        expect(this.parser.makeImageHTML).toHaveBeenCalled();
        let [title, params_frame, params_handler] = this.parser.makeImageHTML.calls.argsFor(0);
        expect(title.equals(this.title)).toBeTruthy();
        expect(params_handler).toEqual({});
        expect(params_frame).toEqual({align: 'left', caption: '', alt: 'Dolor.png', title: '', 'class': ''});
    });

    it('vertical align tests', function() {
        ['top', 'text-top', 'middle', 'bottom', 'text-bottom', 'baseline'].forEach((t, idx) => {
            this.parser.makeImage(this.title, t);
            expect(this.parser.makeImageHTML).toHaveBeenCalled();
            const [title, params_frame, params_handler] = this.parser.makeImageHTML.calls.argsFor(idx);
            expect(title.equals(this.title)).toBeTruthy();
            expect(params_handler).toEqual({});
            expect(params_frame).toEqual({valign: t, caption: '', alt: 'Dolor.png', title: '', align: '', 'class': ''});
        });
    });

    it('should not be valign', function() {
        this.parser.makeImage(this.title, 'top lorem ipsum');
        expect(this.parser.makeImageHTML).toHaveBeenCalled();
        let [title, params_frame, params_handler] = this.parser.makeImageHTML.calls.argsFor(0);
        expect(title.equals(this.title)).toBeTruthy();
        expect(params_handler).toEqual({});
        expect(params_frame).toEqual({caption: 'top lorem ipsum', alt: 'top lorem ipsum', title: 'top lorem ipsum', align: '', 'class': ''});
    });

    it('first valign matters', function() {
        this.parser.makeImage(this.title, 'top|middle|bottom');
        expect(this.parser.makeImageHTML).toHaveBeenCalled();
        let [title, params_frame, params_handler] = this.parser.makeImageHTML.calls.argsFor(0);
        expect(title.equals(this.title)).toBeTruthy();
        expect(params_handler).toEqual({});
        expect(params_frame).toEqual({valign: 'top', caption: '', alt: 'Dolor.png', title: '', align: '', 'class': ''});
    });

    it('link tests', function() {
        const default_frame = {'link-target': false, caption: '', alt: 'Dolor.png', title: '', align: '', 'class': ''};
        [{
            from: 'link=https://lorem.ipsum.com',
            to: {
                ...default_frame,
                'link-url': 'https://lorem.ipsum.com'
            }
        }, {
            from: 'link=Lorem:Ipsum',
            to: {
                ...default_frame,
                'link-title': Title.newFromText('Lorem:Ipsum', this.parser.parserConfig)
            }
        }, {
            from: 'link=',
            to: {
                ...default_frame,
                'no-link': true
            }
        }, {
            from: 'link=|lorem ipsum dolor',
            to: {
                'no-link': true,
                'link-target': false,
                caption: 'lorem ipsum dolor',
                alt: 'lorem ipsum dolor',
                title: 'lorem ipsum dolor',
                align: '',
                'class': ''
            }
        }, {
            from: 'link', // should not be treated as link
            to: {
                caption: 'link',
                alt: 'link',
                title: 'link',
                align: '',
                'class': ''
            }
        }].forEach(({from, to}, idx) => {
            this.parser.makeImage(this.title, from);
            expect(this.parser.makeImageHTML).toHaveBeenCalled();
            let [title, params_frame, params_handler] = this.parser.makeImageHTML.calls.argsFor(idx);
            expect(title.equals(this.title)).toBeTruthy();
            expect(params_handler).toEqual({});
            expect(params_frame).toEqual(to);
        });
    });

    it('thumb, frame, etc.', function() {
        const default_frame = {caption: '', alt: 'Dolor.png', title: '', align: '', 'class': ''};
        [{
            from: 'thumb',
            to: {
                ...default_frame,
                thumbnail: false
            }
        }, {
            from: 'thumb=lorem.png',
            to: {
                ...default_frame,
                manualthumb: 'lorem.png'
            }
        }, {
            from: 'frame',
            to: {
                ...default_frame,
                framed: false
            }
        }, {
            from: 'frameless',
            to: {
                ...default_frame,
                title: '',
                frameless: false
            }
        }, {
            from: 'border',
            to: {
                ...default_frame,
                title: '',
                border: false
            }
        }, {
            // should use first option and ignore others (last option become title)
            from: 'frameless|framed|thumb',
            to: {
                title: 'thumb',
                alt: 'thumb',
                caption: 'thumb',
                frameless: false,
                align: '',
                'class': ''
            }
        }].forEach(({from, to}, idx) => {
            this.parser.makeImage(this.title, from);
            expect(this.parser.makeImageHTML).toHaveBeenCalled();
            let [title, params_frame, params_handler] = this.parser.makeImageHTML.calls.argsFor(idx);
            expect(title.equals(this.title)).toBeTruthy();
            expect(params_handler).toEqual({});
            expect(params_frame).toEqual(to);
        });
    });

    it('alt, class, upright - misc options', function() {
        const default_frame = {caption: '', alt: 'Dolor.png', title: '', align: '', 'class': ''};
        [{
            from: 'alt=lorem ipsum|dolor sit amet',
            to: {
                alt: 'lorem ipsum',
                caption: 'dolor sit amet',
                title: 'dolor sit amet',
                align: '',
                'class': ''
            }
        }, {
            from: 'class=lorem-ipsum',
            to: {
                ...default_frame,
                'class': 'lorem-ipsum'
            }
        }, {
            from: 'upright=123',
            to: {
                ...default_frame,
                upright: '123'
            }
        }].forEach(({from, to}, idx) => {
            this.parser.makeImage(this.title, from);
            expect(this.parser.makeImageHTML).toHaveBeenCalled();
            let [title, params_frame, params_handler] = this.parser.makeImageHTML.calls.argsFor(idx);
            expect(title.equals(this.title)).toBeTruthy();
            expect(params_handler).toEqual({});
            expect(params_frame).toEqual(to);
        });
    });
});


describe('Compare MWParser.handleInternalLinks results with MediaWiki for image links (test makeImage + makeImageHTML)', function() {
    beforeEach(function() {
        this.parser = new MWParser({
            uploadFileURL: '/index.php$1',

            titleExists(title) {
                if(title.getPrefixedText() == 'File:LoremIpsum not-existing.png')
                    return false;
                return true;
            },

            getFullUrl(title, query=null, proto='//') {
                if(title.getPrefixedText() == 'File:LoremIpsum.png')
                    return '/index.php/File:LoremIpsum.png';
                if(title.getPrefixedText() == 'Lorem:Ipsum')
                    return '/index.php/Lorem:Ipsum';
                return '';
            },

            makeThumb(title, width=false, height=false, doNotZoomIn=false) {
                let w, h, url = title.getImageUrl()

                if(title.getPrefixedText() == 'File:LoremIpsum.png')
                    [w, h] = [313, 490];
                else if(title.getPrefixedText() == 'File:LoremIpsumThumb.png')
                    [w, h] = [234, 239];
                else
                    return false;

                if((width !== false || height !== false) && width < w) {
                    [w, h] = calcThumbnailSize(w, h, width, height);
                    url = title.getThumbUrl(w);
                }

                return {
                    url,
                    width: w,
                    height: h
                };
            }
        });
    });

    it('compare tests', async function() {
        const acceptDiffs = [
            ['Special%3AUpload', 'Special:Upload'],             // /index.php?title=Special%3AUpload&wpDestFile=LoremIpsum_not-existing.png
            [/width: (\d+)px;/g, 'width:$1px;'],                // thumb test, in wiki tere is no space before CSS value
            ['192px-LoremIpsum.png', '191px-LoremIpsum.png']    // image height
        ];
        await compareTest('image-links', txt => {
            txt = this.parser.handleInternalLinks(txt);
            txt = acceptDiffs.reduce((txt1, [from, to]) => txt1.replace(from, to), txt);
            return txt;
        });
    });
});


describe('Compare MWParser.handleInternalLinks results with MediaWiki for internal links', function() {
    beforeEach(function() {
        this.parser = new MWParser({
            server: '$2',
            articlePath: '/index.php/$2',
            queryArticlePath: '/index.php$1',
            uploadFileURL: '/index.php$1',

            titleExists(title) {
                if(title.getPrefixedText() == 'Lorem ipsum not existing' || title.getPrefixedText() == 'Media:LoremIpsum not-existing.png')
                    return false;
                return true;
            }
        });
    });

    it('compare tests', async function() {
        const acceptDiffs = [
            ['Special%3AUpload', 'Special:Upload'],
        ];
        await compareTest('internal-links', txt => {
            txt = this.parser.handleInternalLinks(txt);
            txt = acceptDiffs.reduce((txt1, [from, to]) => txt1.replace(from, to), txt);
            return txt;
        });
    });
});


describe('Test MWParser.handleExternalLinks', function() {
    beforeEach(function() {
        this.parser = new MWParser();
    });

    it('external links basic tests', function() {
        let result = this.parser.handleExternalLinks('Lorem ipsum [http://lorem1.ipsum.com dolor sit amet] consectetur adipiscing.');
        expect(result).toEqual('Lorem ipsum <a rel="nofollow" class="external text" href="http://lorem1.ipsum.com">dolor sit amet</a> consectetur adipiscing.');
        expect(this.parser.externalLinks.length).toEqual(1);
        expect(this.parser.externalLinks).toEqual(['http://lorem1.ipsum.com']);

        result = this.parser.handleExternalLinks('Lorem ipsum [http://lorem2.ipsum.com] consectetur adipiscing.');
        expect(result).toEqual('Lorem ipsum <a rel="nofollow" class="external autonumber" href="http://lorem2.ipsum.com">[1]</a> consectetur adipiscing.');
        expect(this.parser.externalLinks.length).toEqual(2);
        expect(this.parser.externalLinks).toEqual(['http://lorem1.ipsum.com', 'http://lorem2.ipsum.com']);

        result = this.parser.handleExternalLinks('Lorem ipsum [http://lorem3.ipsum.com&gt;/dolor sit amet] consectetur adipiscing.');
        expect(result).toEqual('Lorem ipsum <a rel="nofollow" class="external text" href="http://lorem3.ipsum.com">&gt;/dolor sit amet</a> consectetur adipiscing.');
        expect(this.parser.externalLinks.length).toEqual(3);
        expect(this.parser.externalLinks).toEqual(['http://lorem1.ipsum.com', 'http://lorem2.ipsum.com', 'http://lorem3.ipsum.com']);
    });

    it('not external links', function() {
        let txt = 'Lorem ipsum [dttp://lorem1.ipsum.com dolor sit amet] consectetur adipiscing.';
        let result = this.parser.handleExternalLinks(txt);
        expect(result).toEqual(txt);
        expect(this.parser.externalLinks.length).toEqual(0);

        txt = 'Lorem ipsum [http://lorem1.ipsum.com dolor sit amet consectetur adipiscing.';
        result = this.parser.handleExternalLinks(txt);
        expect(result).toEqual(txt);
        expect(this.parser.externalLinks.length).toEqual(0);
    });

    it('external image links (+MWParser.maybeMakeExternalImage test)', function() {
        let parser = new MWParser({
            allowExternalImage(url) {
                if(url == 'http://lorem.ipsum.com/loremNotAllowed.jpg')
                    return false;
                return true;
            }
        });

        let result = parser.handleExternalLinks('Lorem ipsum [http://lorem.ipsum.com/loremNotAllowed.jpg http://lorem.ipsum.com/loremNotAllowed.jpg] consectetur adipiscing.');
        expect(result).toEqual('Lorem ipsum <a rel="nofollow" class="external text" href="http://lorem.ipsum.com/loremNotAllowed.jpg">http://lorem.ipsum.com/loremNotAllowed.jpg</a> consectetur adipiscing.');
        expect(parser.externalLinks.length).toEqual(1);
        expect(parser.externalLinks).toEqual(['http://lorem.ipsum.com/loremNotAllowed.jpg']);

        result = parser.handleExternalLinks('Lorem ipsum [http://lorem.ipsum.com/lorem.jpg http://lorem.ipsum.com/lorem.jpg] consectetur adipiscing.');
        expect(result).toEqual('Lorem ipsum <a rel="nofollow" class="external text" href="http://lorem.ipsum.com/lorem.jpg"><img src="http://lorem.ipsum.com/lorem.jpg" alt="lorem.jpg"></a> consectetur adipiscing.');
        expect(parser.externalLinks.length).toEqual(2);
        expect(parser.externalLinks).toEqual(['http://lorem.ipsum.com/loremNotAllowed.jpg', 'http://lorem.ipsum.com/lorem.jpg']);
    });
});


describe('Test MWParser.maybeMakeExternalImage', function() {
    beforeEach(function() {
        this.parser = new MWParser({
            allowExternalImage(url) {
                if(url == 'http://lorem.ipsum.com/loremNotAllowed.jpg')
                    return false;
                return true;
            }
        });
    });

    it('not an external image link', function() {
        let result = this.parser.maybeMakeExternalImage('http://lorem.ipsum.com/plik.txt');
        expect(result).toBeFalsy();

        result = this.parser.maybeMakeExternalImage('ftp://lorem.ipsum.com/plik.jpg');
        expect(result).toBeFalsy();

        result = this.parser.maybeMakeExternalImage('http://lorem.ipsum.com');
        expect(result).toBeFalsy();
    });

    it('not allowed external image', function() {
        let result = this.parser.maybeMakeExternalImage('http://lorem.ipsum.com/loremNotAllowed.jpg');
        expect(result).toBeFalsy();

        result = this.parser.maybeMakeExternalImage('http://lorem.ipsum.com/lorem.jpg');
        expect(result).toBeTruthy();
    });

    it('allowed external image test', function() {
        let result = this.parser.maybeMakeExternalImage('http://lorem.ipsum.com/lorem.jpg');
        expect(result).toEqual('<img src="http://lorem.ipsum.com/lorem.jpg" alt="lorem.jpg">');
    });
});


describe('Test tag extensions', function() {
    it('Basic tests', function() {
        this.parser = new MWParser();
        this.parser.setFunctionTagHook('lorem-ipsum', (inner, attrs, parser, frame) => {
            return 'Lorem ipsum ' + parser.recursiveTagParse(inner, frame) + ', consectetur adipiscing elit.';
        });
        let result = this.parser.parse('<lorem-ipsum>dolor sit amet</lorem-ipsum>');
        expect(result).toEqual('Lorem ipsum dolor sit amet, consectetur adipiscing elit.');
    });
});


describe('test templates usage', function() {
    it('basic template usage', function() {
        let parser = new MWParser({
            getTemplate(title) {
                if(title == 'LoremIpsum') {
                    return 'template: Lorem ipsum --{{{dolor|consectetur adipiscing elit}}}--.';
                }
                return false;
            }
        });
        let result = parser.parse('Lorem ipsum: {{loremIpsum|dolor=dolor sit amet}}');
        expect(result).toEqual('Lorem ipsum: template: Lorem ipsum --dolor sit amet--.');
    });

    it('not existing template', function() {
        let parser = new MWParser({
            getTemplate(title) {
                return false;
            }
        });

        let result = parser.parse('Lorem ipsum: {{loremIpsum|dolor=dolor sit amet}} www [[aaaaa]]');

    });
});

