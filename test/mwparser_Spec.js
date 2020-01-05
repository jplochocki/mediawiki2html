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
        let par = new MWParser();
        let result = par.handleInternalLinks(`Lorem ipsum [[File:dolor.png|150x150px|center|left|top|thumb|opis obrazka]]lorem ipsum.`);
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
    it('basic tests', function() {
        //makeImage(title, options)
    });
});
