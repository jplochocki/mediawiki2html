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
        Object.entries(par.magicwords.imageMagicWords).forEach(([wordName, values]) => {
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
                if(title == 'Template:LoremIpsum') {
                    return 'template: Lorem ipsum --{{{dolor|consectetur adipiscing elit}}}--.';
                }
                return false;
            }
        });
        let result = parser.parse('Lorem ipsum: {{loremIpsum|dolor=dolor sit amet}}');
        expect(result).toEqual('Lorem ipsum: template: Lorem ipsum --dolor sit amet--.');

        result = parser.parse('Lorem ipsum: {{loremIpsum}}');
        expect(result).toEqual('Lorem ipsum: template: Lorem ipsum --consectetur adipiscing elit--.');
    });

    it('not existing template', function() {
        let parser = new MWParser({
            getTemplate(title) {
                return false;
            }
        });

        let result = parser.parse('Lorem ipsum: {{loremIpsum|dolor=dolor sit amet}} consectetur [[adipiscing elit]]');
        expect(result).toEqual('Lorem ipsum: <a title="Template:LoremIpsum (page does not exist)" '
            + 'href="//en.wikipedia.org/w/index.php?title=Template%3ALoremIpsum&action=edit&redlink=1" class="new">Template:LoremIpsum</a> '
            + 'consectetur <a title="Adipiscing elit" href="//en.wikipedia.org/w/index.php?title=Adipiscing_elit">adipiscing elit</a>');
    });

    it('namespace matching in template title', function() {
        let parser = new MWParser({
            getTemplate(title) {
                return 'lorem ipsum';
            }
        });

        spyOn(parser.parserConfig, 'getTemplate').and.callThrough();

        [
            ['{{Lorem ipsum}}', 'Template:Lorem ipsum'],
            ['{{Template:Lorem ipsum}}', 'Template:Lorem ipsum'],
            ['{{:Lorem ipsum}}', 'Lorem ipsum'],
            ['{{Talk:Lorem ipsum}}', 'Talk:Lorem ipsum'],
            ['{{Lorem:Lorem ipsum}}', 'Template:Lorem:Lorem ipsum'],
        ].forEach(([wikiTxt, calledTemplateTitle]) => {
            let result = parser.parse(wikiTxt);
            expect(parser.parserConfig.getTemplate).toHaveBeenCalledWith(calledTemplateTitle);
        });
    });

    it('subst should be ignored', function() {
        let parser = new MWParser({
            getTemplate(title) {
                return 'ipsum dolor';
            }
        });

        spyOn(parser.magicwords, 'matchSubstAtStart').and.callThrough();
        spyOn(parser.parserConfig, 'getTemplate').and.callThrough();

        let result = parser.parse('Lorem {{subst:Lorem ipsum}} sit amet.');
        expect(parser.magicwords.matchSubstAtStart).toHaveBeenCalledWith('Subst:Lorem ipsum');
        expect(parser.magicwords.matchSubstAtStart.calls.mostRecent().returnValue).toEqual({subst: 'subst', text: 'Lorem ipsum'});
        expect(parser.parserConfig.getTemplate).toHaveBeenCalledWith('Template:Lorem ipsum');
        expect(result).toEqual('Lorem ipsum dolor sit amet.');

        result = parser.parse('Lorem {{safesubst:Lorem ipsum}} sit amet.');
        expect(parser.magicwords.matchSubstAtStart).toHaveBeenCalledWith('Safesubst:Lorem ipsum');
        expect(parser.magicwords.matchSubstAtStart.calls.mostRecent().returnValue).toEqual({subst: 'safesubst', text: 'Lorem ipsum'});
        expect(parser.parserConfig.getTemplate).toHaveBeenCalledWith('Template:Lorem ipsum');
        expect(result).toEqual('Lorem ipsum dolor sit amet.');
    });

    it('msgnw should return wiki text', function() {
        let parser = new MWParser({
            getTemplate(title) {
                if(/^template:lorem ipsum$/i.test(title))
                    return 'Lorem [[ipsum]] {{dolor}} sit <b>amet</b>.';
                return false;
            }
        });

        let result = parser.parse('{{msgnw:lorem ipsum}}');
        expect(result).toEqual('Lorem &#91;&#91;ipsum&#93;&#93; &#123;&#123;dolor&#125;&#125; sit &#60;b&#62;amet&#60;/b&#62;.');
    });

    it('msg + raw should be ignored', function() {
        let parser = new MWParser({
            getTemplate(title) {
                if(/^template:lorem ipsum$/i.test(title))
                    return 'Lorem [[ipsum]] dolor sit amet.';
                return false;
            }
        });

        spyOn(parser.parserConfig, 'getTemplate').and.callThrough();

        let result = parser.parse('{{lorem ipsum}}');
        let resultMSG = parser.parse('{{msg:lorem ipsum}}');
        let resultRAW = parser.parse('{{raw:lorem ipsum}}');

        expect(result).toEqual('Lorem <a title="Ipsum" href="//en.wikipedia.org/w/index.php?title=Ipsum">ipsum</a> dolor sit amet.');
        expect(result).toEqual(resultMSG);
        expect(result).toEqual(resultRAW);
    });

    it('check variables in {{ }}', function() {
        let parser = new MWParser({
            getTemplate(title) {
                return 'ipsum dolor';
            }
        });
        spyOn(parser.parserConfig, 'getTemplate').and.callThrough();

        jasmine.clock().install();
        jasmine.clock().mockDate(new Date(Date.UTC(2020, 2, 7))); // mock date for revisiontimestamp / localtimestamp / etc

        parser.magicwords.variables.forEach(mvar => {
            let last = null;
            mvar.synonyms.forEach(mword => {
                let resultA_id = parser.magicwords.matchStartToEnd(mword);
                expect(resultA_id).toBeTruthy();
                expect(resultA_id).toEqual(mvar.id);

                let resultA = parser.magicwords.expandMagicVariable(resultA_id);
                let resultB = parser.parse(`{{${mword}}}`);

                expect(resultA).toEqual(resultB);
                expect(parser.parserConfig.getTemplate).not.toHaveBeenCalled();

                if(last === null)
                    last = resultA;
                else
                    expect(last).toEqual(resultB);
            });
        });

        jasmine.clock().uninstall();
    });

    it('template in template source test', function() {
        let parser = new MWParser({
            getTemplate(title) {
                if(/^template:lorem ipsum$/i.test(title))
                    return 'Lorem ipsum {{dolor|dolor=sit amet}}, {{consectetur}}.';
                else if(/dolor/i.test(title))
                    return 'dolor {{{dolor|not sit amet}}}{{Lorem ipsum empty template}}'
                else if(/lorem ipsum empty template/i.test(title))
                    return '';
                else if(/consectetur/i.test(title))
                    return 'consectetur adipiscing elit';

                return false;
            }
        });

        let result = parser.parse('{{Lorem ipsum}}');
        expect(result).toEqual('Lorem ipsum dolor sit amet, consectetur adipiscing elit.');
    });

    it('template loop detection - scenario 1 (template infinity recursion)', function() {
        let parser = new MWParser({
            getTemplate(title) {
                if(/^template:lorem ipsum$/i.test(title))
                    return 'Lorem ipsum {{Lorem ipsum}}.';
                return false;
            }
        });

        let result = parser.parse('{{Lorem ipsum}}');
        expect(result).toEqual('Lorem ipsum Lorem ipsum Lorem ipsum <span class="error">Template loop detected: '
            + '<a title="Template:Lorem ipsum" href="//en.wikipedia.org/w/index.php?title=Template%3ALorem_ipsum">Template:Lorem ipsum</a></span>...');
    });

    it('template loop detection - scenario 2 (template infinity recursion)', function() {
        let parser = new MWParser({
            getTemplate(title) {
                const words = 'lorem ipsum dolor sit amet consectetur adipiscing elit'.split(/\s/);
                let x = words.findIndex(w => 'template:' + w == title.toLowerCase());
                if(x >= words.length -1)
                    return 'A {{lorem}}';
                if(x != -1)
                    return `A {{${ words[x + 1] }}}`;
                return false;
            }
        });

        let result = parser.parse('{{lorem}}');
        expect(result).toEqual('A A A A A A A A <span class="error">Template loop detected: '
            + '<a title="Template:Lorem" href="//en.wikipedia.org/w/index.php?title=Template%3ALorem">Template:Lorem</a></span>');

        parser = new MWParser({
            getTemplate(title) {
                const words = 'lorem ipsum dolor sit amet consectetur adipiscing elit'.split(/\s/);
                let x = words.findIndex(w => 'template:' + w == title.toLowerCase());
                if(x >= words.length -1)
                    return 'A {{lorem}} {{maecenas}}';
                else if(x != -1)
                    return `A {{${ words[x + 1] }}} {{maecenas}}`;
                else if(/maecenas/i.test(title))
                    return 'B';
                return false;
            }
        });

        result = parser.parse('{{lorem}}');
        expect(result).toEqual('A A A A A A A A <span class="error">Template loop detected: '
            + '<a title="Template:Lorem" href="//en.wikipedia.org/w/index.php?title=Template%3ALorem">Template:Lorem</a></span> B B B B B B B B');
    });

    it('template loop detection - scenario 3 (template max deep)', function() {
        let parser = new MWParser({
            getTemplate(title) {
                let no = /^template:lorem ipsum (\d+)$/i.exec(title);
                if(no) {
                    no = parseInt(no[1], 10);
                    return `${ no } {{Lorem ipsum ${ no + 1 }}}`;
                }
                return false;
            }
        });

        let result = parser.parse('{{lorem ipsum 1}}');
        expect(result).toEqual('1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39 40 '
            + '<span class="error">Template recursion depth limit exceeded (40)</span>');
    });

    it('template loop detection - scenario 4 (no recursion schould be detected)', function() {
        let parser = new MWParser({
            getTemplate(title) {
                if(/lorem/i.test(title))
                    return 'lorem';
                else if(/ipsum/i.test(title))
                    return 'ipsum {{lorem}}';
                else if(/dolor/i.test(title))
                    return 'dolor {{ipsum}}';
                else if(/sit/i.test(title))
                    return 'sit {{dolor}}';
                else if(/amet/i.test(title))
                    return 'amet {{sit}}';
                return false;
            }
        });

        let result = parser.parse('{{lorem}} {{ipsum}} {{lorem}} {{ipsum}} {{lorem}} {{ipsum}} {{lorem}} {{ipsum}} {{dolor}} {{sit}} {{amet}}');
        expect(result).toEqual('lorem ipsum lorem lorem ipsum lorem lorem ipsum lorem lorem ipsum lorem dolor ipsum lorem sit dolor ipsum lorem amet sit dolor ipsum lorem');
    });

    it('parser functions basic tests', function() {
        let parser = new MWParser({
            getTemplate(title) {
                return false;
            },

            callParserFunction(funcName, args) {
                if(/#LoremIpsum/.test(funcName))
                    return `Lorem ${ args['lorem'] } dolor ${ args['dolor'] }.`;

                return false;
            }
        });

        spyOn(parser.parserConfig, 'getTemplate').and.callThrough();
        spyOn(parser.parserConfig, 'callParserFunction').and.callThrough();

        let result = parser.parse('{{#LoremIpsum: lorem=ipsum|dolor=sit amet}}');
        expect(result).toEqual('Lorem ipsum dolor sit amet.');

        expect(parser.parserConfig.getTemplate).not.toHaveBeenCalled();
        expect(parser.parserConfig.callParserFunction).toHaveBeenCalledWith('#LoremIpsum', {lorem: 'ipsum', dolor: 'sit amet'});
    });
});


describe('template name expansion', function() {
    it('template in template name basic tests', function() {
        let parser = new MWParser({
            getTemplate(title) {
                if(/^template:ipsum$/i.test(title))
                    return 'ipsum';
                else if(/^template:lorem ipsum dolor$/i.test(title))
                    return 'Lorem ipsum dolor';
                return false;
            }
        });

        let result = parser.parse('{{Lorem {{ipsum}} dolor}}');
        expect(result).toEqual('Lorem ipsum dolor');
    });

    it('template param should be expanded', function() {
        let parser = new MWParser({
            getTemplate(title) {
                if(/^template:lorem$/i.test(title))
                    return '{{Lorem ipsum {{{ipsum}}}}}';
                else if(/^template:lorem ipsum dolor$/i.test(title))
                    return 'Lorem ipsum dolor';
                return false;
            }
        });

        let result = parser.parse('{{Lorem|ipsum=dolor}}');
        expect(result).toEqual('Lorem ipsum dolor');
    });

    it('default values should be used if needed', function() {
        let parser = new MWParser({
            getTemplate(title) {
                if(/^template:lorem$/i.test(title))
                    return '{{Lorem {{{lorem|ipsum}}} {{{ipsum}}}}}';
                else if(/^template:lorem ipsum dolor$/i.test(title))
                    return 'Lorem ipsum dolor';
                return false;
            }
        });

        let result = parser.parse('{{Lorem|ipsum=dolor}}');
        expect(result).toEqual('Lorem ipsum dolor');
    });

    it('not expanded template should be linked and escaped', function() {
        let parser = new MWParser({
            getTemplate(title) {
                if(/^template:lorem$/i.test(title))
                    return '{{Lorem {{ipsum}} dolor}}';
                else if(/^template:lorem ipsum dolor$/i.test(title))
                    return 'Lorem ipsum dolor';
                return false;
            }
        });

        spyOn(parser.parserConfig, 'getTemplate').and.callThrough();

        let result = parser.parse('{{Lorem}}');
        expect(result).toEqual('&#123;&#123;Lorem <a title="Template:Ipsum (page does not exist)" href="//en.wikipedia.org/w/index.php?title=Template%3AIpsum&action=edit&redlink=1"'
            + ' class="new">Template:Ipsum</a> dolor&#125;&#125;');

        expect(parser.parserConfig.getTemplate).not.toHaveBeenCalledWith('Template:Lorem ipsum dolor');
        expect(parser.parserConfig.getTemplate).toHaveBeenCalledWith('Template:Lorem');
    });

    it('template recursion check (with template name combined)', function() {
        let parser = new MWParser({
            getTemplate(title) {
                if(/^template:lorem$/i.test(title))
                    return '{{Lorem {{{ipsum}}} dolor}}';
                else if(/^template:lorem ipsum dolor$/i.test(title))
                    return 'Lorem ipsum dolor {{Lorem|ipsum=ipsum}}.';
                return false;
            }
        });

        let result = parser.parse('{{Lorem|ipsum=ipsum}}');
        expect(result).toEqual('Lorem ipsum dolor Lorem ipsum dolor <span class="error">Template loop detected: '
            + '<a title="Template:Lorem" href="//en.wikipedia.org/w/index.php?title=Template%3ALorem">Template:Lorem</a></span>..');
    });
});


describe('template arguments expansion', function() {
    it('parameters in template arguments expansion', function() {
        let parser = new MWParser({
            getTemplate(title) {
                if(title == 'Template:Lorem')
                    return 'Lorem / {{Ipsum|param {{{ipsum}}}=param ipsum value|param dolor=param {{{dolor}}} value}}.';
                else if(title == 'Template:Ipsum')
                    return 'param ipsum="{{{param ipsum}}}" / param dolor="{{{param dolor}}}"';
                return false;
            }
        });

        let result = parser.parse('{{Lorem|ipsum=ipsum|dolor=dolor}}');
        expect(result).toEqual('Lorem / param ipsum="param ipsum value" / param dolor="param dolor value".');
    });

    it('templates in template arguments expansion', function() {
        let parser = new MWParser({
            getTemplate(title) {
                if(title == 'Template:Ipsum template')
                    return 'ipsum';
                else if(title == 'Template:Dolor template')
                    return 'dolor';

                else if(title == 'Template:Lorem')
                    return 'Lorem / {{Ipsum|param {{ipsum template}}=param ipsum value|param dolor=param {{dolor template}} value}}.';
                else if(title == 'Template:Ipsum')
                    return 'param ipsum="{{{param ipsum}}}" / param dolor="{{{param dolor}}}"';
                return false;
            }
        });

        let result = parser.parse('{{Lorem|ipsum=should not be used|dolor=should not be used}}');
        expect(result).toEqual('Lorem / param ipsum="param ipsum value" / param dolor="param dolor value".');
    });

    it('unknown parameters in template arguments expansion', function() {
        let parser = new MWParser({
            getTemplate(title) {
                if(title == 'Template:Lorem')
                    return 'Lorem / {{Ipsum|param {{{ipsum}}}=param ipsum value|param dolor=param {{{dolor}}} value}}.';
                else if(title == 'Template:Ipsum')
                    return 'param ipsum="{{{param ipsum}}}" / param dolor="{{{param dolor}}}"';
                return false;
            }
        });

        let result = parser.parse('{{Lorem}}');
        expect(result).toEqual('Lorem / param ipsum="{{{param ipsum}}}" / param dolor="param {{{dolor}}} value".');

        result = parser.parse('{{Ipsum}}');
        expect(result).toEqual('param ipsum="{{{param ipsum}}}" / param dolor="{{{param dolor}}}"');
    });

    it('unknown templates in template arguments expansion', function() {
        let parser = new MWParser({
            getTemplate(title) {
                if(title == 'Template:Lorem')
                    return 'Lorem / {{Ipsum|param {{ipsum template}}=param ipsum value|param dolor=param {{dolor template}} value}}.';
                else if(title == 'Template:Ipsum')
                    return 'param ipsum="{{{param ipsum}}}" / param dolor="{{{param dolor}}}"';
                return false;
            }
        });

        let result = parser.parse('{{Lorem|ipsum=should not be used|dolor=should not be used}}');
        expect(result).toEqual('Lorem / param ipsum="{{{param ipsum}}}" / param dolor="param <a title="Template:Dolor template (page does not exist)" '
            + 'href="//en.wikipedia.org/w/index.php?title=Template%3ADolor_template&action=edit&redlink=1" class="new">Template:Dolor template</a> value".');
    });

    it('templates in template arguments recursion test', function() {
        let parser = new MWParser({
            getTemplate(title) {
                if(title == 'Template:Ipsum template')
                    return 'ipsum {{Ipsum template}}';
                else if(title == 'Template:Dolor template')
                    return 'dolor {{Dolor template}}';

                else if(title == 'Template:Lorem')
                    return 'Lorem / {{Ipsum|param {{ipsum template}}=param ipsum value|param dolor=param {{dolor template}} value}}.';
                else if(title == 'Template:Ipsum')
                    return 'param ipsum="{{{param ipsum}}}" / param dolor="{{{param dolor}}}"';
                return false;
            }
        });

        let result = parser.parse('{{Lorem|ipsum=should not be used|dolor=should not be used}}');
        expect(result).toEqual('Lorem / param ipsum="{{{param ipsum}}}" / param dolor="param dolor dolor dolor <span class="error">'
            + 'Template loop detected: <a title="Template:Dolor template" href="//en.wikipedia.org/w/index.php?title=Template%3ADolor_template">Template:Dolor template</a></span> value".');
    });
});


describe('template params name & dafault value expansion', function() {
    it('template and template param in template param name expansion', function() {
        let parser = new MWParser({
            getTemplate(title) {
                if(title == 'Template:Lorem')
                    return '{{{lorem}}} {{{param {{dolor|param dolor=dolor}}}}} {{{param {{{sit|default lorem}}}}}}.';
                else if(title == 'Template:Dolor')
                    return '{{{param dolor}}}';
                return false;
            }
        });

        let result = parser.parse('{{Lorem|lorem=Lorem ipsum|param dolor=dolor|sit=sit amet|param sit amet=sit amet}}');
        expect(result).toEqual('Lorem ipsum dolor sit amet.');
    });
});


describe('standard parser functions tests', function() {
    it('#language basic tests', function() {
        let parser = new MWParser();

        let result = parser.parse('{{#language:en}}');
        expect(result).toEqual('English');

        result = parser.parse('{{#lAnGuAgE:en}}'); // names are case insensitive
        expect(result).toEqual('English');

        result = parser.parse('{{#language:pl}}');
        expect(result).toEqual('Polish');

        result = parser.parse('{{#language: {{PAGELANGUAGE}}}}');
        expect(result).toEqual('English');
    });

    it('#tag basic tests', function() {
        let parser = new MWParser();

        let result = parser.parse('{{#tag:b}}'); // no content
        expect(result).toEqual('<b></b>');

        result = parser.parse('{{#tag:b|}}'); // empty content
        expect(result).toEqual('<b></b>');

        result = parser.parse('{{#tag:b|Lorem ipsum dolor|sit|amet|lorem}}'); // unnecessary arguments
        expect(result).toEqual('<b>Lorem ipsum dolor</b>');

        result = parser.parse('{{#tag:b|Lorem ipsum dolor|sit|amet|title=sit amet|lorem}}');
        expect(result).toEqual('<b title="sit amet">Lorem ipsum dolor</b>');

        result = parser.parse('{{#tag:a}}'); // a should be escaped
        expect(result).toEqual('&lt;a&gt;&lt;/a&gt;');

        result = parser.parse('{{#tag:lorem}}'); // unknown tag should be escaped
        expect(result).toEqual('&lt;lorem&gt;&lt;/lorem&gt;');

        result = parser.parse('{{#tag:b|Lorem ipsum dolor|title=sit amet}}'); // content + parameters
        expect(result).toEqual('<b title="sit amet">Lorem ipsum dolor</b>');

        result = parser.parse('{{#tag:b|Lorem ipsum dolor|lorem=sit amet}}'); // unacceptable parameters
        expect(result).toEqual('<b>Lorem ipsum dolor</b>');
    });

    it('PAGENAME (and other page title related MagicVariables in parser function form)', function() {
        let parser = new MWParser();

        let result = parser.parse('{{PAGENAME: Category:Lorem ipsum}}');
        expect(result).toEqual('Lorem ipsum');

        result = parser.parse('{{PAGENAMEE: Category:Lorem ipsum}}');
        expect(result).toEqual('Lorem_ipsum');

        result = parser.parse('{{FULLPAGENAME: Category:Lorem ipsum}}');
        expect(result).toEqual('Category:Lorem ipsum');

        result = parser.parse('{{FULLPAGENAMEE: Category:Lorem ipsum}}');
        expect(result).toEqual('Category:Lorem_ipsum');

        result = parser.parse('{{SUBPAGENAME: User:Lorem ipsum/Dolor}}');
        expect(result).toEqual('Dolor');

        result = parser.parse('{{SUBPAGENAMEE: User:Lorem ipsum/Dolor}}');
        expect(result).toEqual('Dolor');

        result = parser.parse('{{BASEPAGENAME: User:Lorem ipsum/Dolor}}');
        expect(result).toEqual('Lorem ipsum');

        result = parser.parse('{{BASEPAGENAMEE: User:Lorem ipsum/Dolor}}');
        expect(result).toEqual('Lorem_ipsum');
    });
});


describe('Parser.doQuotes()', function() {
    it('basic tests', function() {
        let parser = new MWParser();

        let result = parser.doQuotes("Lorem ''ipsum'' dolor '''sit''' amet.");
        expect(result).toEqual('Lorem <i>ipsum</i> dolor <b>sit</b> amet.');

        result = parser.doQuotes("Lorem ''''ipsum'''' dolor sit amet.");
        expect(result).toEqual('Lorem \'<b>ipsum\'</b> dolor sit amet.');

        result = parser.doQuotes("Lorem '''''ipsum dolor''''' sit amet.");
        expect(result).toEqual('Lorem <i><b>ipsum dolor</b></i> sit amet.');

        result = parser.doQuotes("Lorem '''''ipsum'' dolor''' sit amet.");
        expect(result).toEqual('Lorem <b><i>ipsum</i> dolor</b> sit amet.');

        result = parser.doQuotes("Lorem '''''ipsum''' dolor'' sit amet.");
        expect(result).toEqual('Lorem <i><b>ipsum</b> dolor</i> sit amet.');

        result = parser.doQuotes("Lorem ''ipsum dolor sit amet.");
        expect(result).toEqual('Lorem <i>ipsum dolor sit amet.</i>');

        result = parser.doQuotes("Lorem '''ipsum dolor sit amet.");
        expect(result).toEqual('Lorem <b>ipsum dolor sit amet.</b>');

        result = parser.doQuotes("Lorem '''''ipsum dolor sit amet.");
        expect(result).toEqual('Lorem <b><i>ipsum dolor sit amet.</i></b>');

        result = parser.doQuotes("Lorem '''''''ipsum dolor sit amet.");
        expect(result).toEqual('Lorem &#39;&#39;<b><i>ipsum dolor sit amet.</i></b>');
        result = parser.doQuotes("Lorem ''''''''ipsum dolor sit amet.");
        expect(result).toEqual('Lorem &#39;&#39;&#39;<b><i>ipsum dolor sit amet.</i></b>');
    });
});


describe('horizontal lines', function() {
    it('basic tests', function() {
        let parser = new MWParser();

        let result = parser.parse('lorem ipsum\n------');
        expect(result).toEqual('lorem ipsum\n<hr>');

        result = parser.parse('lorem ipsum\n---');
        expect(result).toEqual('lorem ipsum\n---');
    });
});


describe('Parser.handleDoubleUnderscore()', function() {
    it('__TOC__ basic tests', function() {
        let parser = new MWParser();
        let result = parser.handleDoubleUnderscore('Lorem ipsum __TOC__ dolor __ToC__ sit amet.');
        expect(result).toEqual('Lorem ipsum <!--MWTOC\'"--> dolor  sit amet.');
        expect(parser.showToc).toBeTruthy();
        expect(parser.forceTocPosition).toBeTruthy();

        parser = new MWParser();
        result = parser.handleDoubleUnderscore('Lorem ipsum __TOC__ dolor __TOC__ sit amet __NOTOC__.');
        expect(result).toEqual('Lorem ipsum <!--MWTOC\'"--> dolor  sit amet .');
        expect(parser.showToc).toBeTruthy();
        expect(parser.forceTocPosition).toBeTruthy();

        parser = new MWParser();
        result = parser.handleDoubleUnderscore('Lorem ipsum __NOTOC__ dolor sit amet.');
        expect(result).toEqual('Lorem ipsum  dolor sit amet.');
        expect(parser.showToc).toBeFalsy();
        expect(parser.forceTocPosition).toBeFalsy();
    });

    it('other double underscores basic tests', function() {
        let parser = new MWParser();
        parser.magicwords.doubleUnderscores.forEach(mw => {
            if(mw.id == 'toc')
                return;

            mw.synonyms.forEach(wrd => {
                let result = parser.handleDoubleUnderscore('Lorem ipsum ' + wrd + ' dolor sit amet');
                expect(result).toEqual('Lorem ipsum  dolor sit amet');
                expect(parser.doubleUnderscores).toContain(mw.id);
            });
        });

        // test all together
        let all = '';
        parser = new MWParser();
        parser.magicwords.doubleUnderscores.forEach(mw => {
            mw.synonyms.forEach(wrd => all += 'Lorem ipsum ' + wrd + ' dolor sit amet. ');
        });
        let result = parser.handleDoubleUnderscore(all);
        parser.magicwords.doubleUnderscores
            .filter(mw => mw.id != 'toc')
            .forEach(mw => expect(parser.doubleUnderscores).toContain(mw.id));
        expect(result).not.toMatch(/__.*?__/gi);

        // __NOGALLERY__
        parser = new MWParser();
        result = parser.handleDoubleUnderscore('Lorem ipsum __NOGALLERY__ dolor sit amet');
        expect(parser.noGallery).toBeTruthy();
    });
});


describe('Parser.handleHeadings()', function() {
    it('basic tests', function() {
        let parser = new MWParser();
        let result = parser.handleHeadings('===Lorem ipsum===\ndolor sit amet');
        expect(result).toEqual('<h3>Lorem ipsum</h3>\ndolor sit amet');

        result = parser.handleHeadings('Lorem ==ipsum== dolor sit amet');
        expect(result).toEqual('Lorem ==ipsum== dolor sit amet');

        result = parser.handleHeadings('Lorem\n======Lorem======\n ipsum dolor sit amet');
        expect(result).toEqual('Lorem\n<h6>Lorem</h6>\n ipsum dolor sit amet');
    });
});
