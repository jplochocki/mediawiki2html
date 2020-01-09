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

    it('images basic tests', function() {
        //let par = new MWParser();
        //let result = par.handleInternalLinks(`Lorem ipsum [[File:dolor.png|150x150px|center|left|top|thumb|opis obrazka]]lorem ipsum.`);
    });
});


describe('Test Parser.makeLinkObj', function() {
    it('basic tests', function() {
        const par = new MWParser();
        let t = Title.newFromText('lorem:ipsum');
        expect(par.makeLinkObj(t)).toEqual('<a title="Lorem:ipsum" href="//en.wikipedia.org/w/index.php?title=Lorem%3Aipsum">Lorem:ipsum</a>');


        let r = par.makeLinkObj(t, 'link title', {foo: 'bar'}, 'trail rest of text', 'prefix')
        expect(r).toEqual(
            '<a title="Lorem:ipsum" href="//en.wikipedia.org/w/index.php?foo=bar&title=Lorem%3Aipsum">prefixlink titletrail</a> rest of text');
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


describe('Compare MWParser.handleInternalLinks results with MediaWiki', function() {
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
                if(title.getPrefixedText() == 'File:LoremIpsum.png') {
                    let w = 313, h = 490, url = title.getImageUrl();
                    if(width == 150 && height === false)
                        [w, h, url] = [150, 235, title.getThumbUrl(150)];
                    else if(width === false && height == 150)
                        [w, h, url] = [96, 150, title.getThumbUrl(96)];
                    else if(width == 300 && height == 150)
                        [w, h, url] = [96, 150, title.getThumbUrl(96)];
                    else if(width == 144) // responsive images
                        url = title.getThumbUrl(144);
                    else if(width == 192)
                        url = title.getThumbUrl(191);
                    else if(width == 225)
                        url = title.getThumbUrl(225);
                    else if(width == 300)
                        [w, h, url] = [300, 470, title.getThumbUrl(300)];

                    return {
                        url,
                        width: w,
                        height: h
                    };
                }

                return false;
            }
        });
    });

    it('compare tests', async function() {
        const acceptDiffs = [
            ['Special%3AUpload', 'Special:Upload'], // /index.php?title=Special%3AUpload&wpDestFile=LoremIpsum_not-existing.png
            ['width: 302px;', 'width:302px;']       // thumb test
        ];
        await compareTest('image-links', txt => {
            txt = this.parser.handleInternalLinks(txt);
            txt = acceptDiffs.reduce((txt1, [from, to]) => txt1.replace(from, to), txt);
            return txt;
        });
    });

    it('basic tests', function() {
        let r = this.parser.handleInternalLinks('[[File:LoremIpsum.png|thumb=LoremIpsumThumb.png]]');
        //console.log(r);
    });
});
