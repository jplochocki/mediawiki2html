/**
 * Tests for src/title.js.
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


describe('Test Title.secureAndSplit', function() {
    beforeEach(function() {
        this.parser = new MWParser(); // init constants and default config
    });

    it('trim spaces (and _) from start and end', function() {
        let t = new Title();
        t.mDbkeyform = '   Lorem ipsum  ';
        t.secureAndSplit();
        expect(t.mDbkeyform).toEqual('Lorem_ipsum');

        t.mDbkeyform = '  _ Lorem ipsum _ ';
        t.secureAndSplit();
        expect(t.mDbkeyform).toEqual('Lorem_ipsum');
    });

    it('namespace test', function() {
        let t = new Title();
        t.mDbkeyform = 'Lorem:ipsum';
        t.secureAndSplit();
        expect(t.mNamespace).toEqual(Title.NS_MAIN);
        expect(t.mDbkeyform).toEqual('Lorem:ipsum');

        t.mDbkeyform = 'File:LoremIpsum';
        t.secureAndSplit();
        expect(t.mNamespace).toEqual(Title.NS_FILE);
        expect(t.mDbkeyform).toEqual('LoremIpsum');
    });

    it('interwiki test', function() {
        this.parser = new MWParser({
            validInterwikiNames: ['pl']  // parser changes default config for title
        });
        let t = new Title();

        t.mDbkeyform = 'pl:Lorem:ipsum';
        t.secureAndSplit();
        expect(t.mNamespace).toEqual(Title.NS_MAIN);
        expect(t.mInterwiki).toEqual('pl');
        expect(t.mDbkeyform).toEqual('Lorem:ipsum');

        t.mDbkeyform = 'pl:File:LoremIpsum';
        t.secureAndSplit();
        expect(t.mNamespace).toEqual(Title.NS_MAIN);
        expect(t.mInterwiki).toEqual('pl');
        expect(t.mDbkeyform).toEqual('File:LoremIpsum');
    });

    it('test fragment', function() {
        let t = new Title();
        t.mDbkeyform = 'Lorem#ipsum'
        t.secureAndSplit();
        expect(t.mNamespace).toEqual(0);
        expect(t.mDbkeyform).toEqual('Lorem');
        expect(t.mFragment).toEqual('ipsum');
    });

    it('throw error when UTF8 replacement signs found', function() {
        let t = new Title();
        t.mDbkeyform = 'lorem \xef\xbf\xbd ipsum'
        expect(() => {
            t.secureAndSplit();
        }).toThrowError(Error, 'The requested page title contains an invalid UTF-8 sequence.');
    });

    it('initial colon test', function() {
        let t = new Title();
        t.mDbkeyform = ':LoremIpsum';
        t.secureAndSplit();
        expect(t.mNamespace).toEqual(0);
        expect(t.mDbkeyform).toEqual('LoremIpsum');
    });

    it('Empty title should throw', function() {
        let t = new Title();
        t.mDbkeyform = '';
        expect(() => {
            t.secureAndSplit();
        }).toThrowError(Error, 'The requested page title is empty or contains only the name of a namespace.');

        t.mDbkeyform = ':';
        expect(() => {
            t.secureAndSplit();
        }).toThrowError(Error, 'The requested page title is empty or contains only the name of a namespace.');

        t.mDbkeyform = 'File:';
        expect(() => {
            t.secureAndSplit();
        }).toThrowError(Error, 'The requested page title is empty or contains only the name of a namespace.');
    });

    it('invalid title signs should throw', function() {
        let t = new Title();
        t.mDbkeyform = 'Lorem&amp;ipsum';
        expect(() => {
            t.secureAndSplit();
        }).toThrowError(Error, /^The requested page title contains invalid characters/);
    });

    it('relative path signs should throw', function() {
        let t = new Title();
        expect(() => {
            t.mDbkeyform = '.';
            t.secureAndSplit();
        }).toThrowError(Error, /^Title has relative path/);

        expect(() => {
            t.mDbkeyform = '..';
            t.secureAndSplit();
        }).toThrowError(Error, /^Title has relative path/);

        expect(() => {
            t.mDbkeyform = './Lorem';
            t.secureAndSplit();
        }).toThrowError(Error, /^Title has relative path/);

        expect(() => {
            t.mDbkeyform = '../Lorem';
            t.secureAndSplit();
        }).toThrowError(Error, /^Title has relative path/);

        expect(() => {
            t.mDbkeyform = 'Lorem/./ipsum';
            t.secureAndSplit();
        }).toThrowError(Error, /^Title has relative path/);

        expect(() => {
            t.mDbkeyform = 'Lorem/../ipsum';
            t.secureAndSplit();
        }).toThrowError(Error, /^Title has relative path/);

        expect(() => {
            t.mDbkeyform = 'Lorem/.';
            t.secureAndSplit();
        }).toThrowError(Error, /^Title has relative path/);
    });

    it('magic tides not allowed', function() {
        let t = new Title();
        t.mDbkeyform = 'Lorem~~~Ipsum';
        expect(() => {
            t.secureAndSplit();
        }).toThrowError(Error, /^The requested page title contains invalid magic tilde/);
    });

    it('Too long title', function() {
        let t = new Title();

        t.mDbkeyform = 'File:' + 'a'.repeat(255);
        t.secureAndSplit();

        expect(() => {
            t.mDbkeyform = 'File:' + 'a'.repeat(255) + 'a';
            t.secureAndSplit();
        }).toThrowError(Error, /^The requested page title is too long/);

        t.mDbkeyform = 'Special:' + 'a'.repeat(512);
        t.secureAndSplit();

        expect(() => {
            t.mDbkeyform = 'Special:' + 'a'.repeat(512) + 'a';
            t.secureAndSplit();
        }).toThrowError(Error, /^The requested page title is too long/);
    });

    it('Upper case page title', function() {
        let t = new Title();
        t.mDbkeyform = 'lorem';
        t.secureAndSplit();
        expect(t.mDbkeyform).toEqual('Lorem');

        t.mDbkeyform = 'File:lorem';
        t.secureAndSplit();
        expect(t.mDbkeyform).toEqual('Lorem');

        t.mDbkeyform = 'lorem:ipsum';
        t.secureAndSplit();
        expect(t.mDbkeyform).toEqual('Lorem:ipsum');
    });
});


describe('Test Title.newFromText', function() {
    beforeEach(function() {
        this.parser = new MWParser(); // init constants and default config
    });

    it('basic tests', function() {
        expect(() => {
            Title.newFromText(false);
        }).toThrowError(Error, 'Text must be a string.');

        let t = Title.newFromText('lorem:ipsum');
        expect(t.mDbkeyform).toEqual('Lorem:ipsum');
    });
});


describe('Test Title.getNsIndex', function() {
    it('basic tests', function() {
        this.parser = new MWParser({language: 'en'});
        let t = Title.newFromText('lorem:ipsum');
        expect(t.getNsIndex('MediaWiki')).toEqual(Title.NS_MEDIAWIKI);
        expect(t.getNsIndex('Category')).toEqual(Title.NS_CATEGORY);
        expect(t.getNsIndex('User_talk')).toEqual(Title.NS_USER_TALK);

        this.parser = new MWParser({language: 'pl'});
        t = Title.newFromText('lorem:ipsum');
        expect(t.getNsIndex('MediaWiki')).toEqual(Title.NS_MEDIAWIKI);
        expect(t.getNsIndex('Kategoria')).toEqual(Title.NS_CATEGORY);
        expect(t.getNsIndex('Dyskusja_użytkownika')).toEqual(Title.NS_USER_TALK);
    });
});


describe('Test Title.getNsText', function() {
    it('basic tests', function() {
        this.parser = new MWParser({language: 'en'});
        let t = Title.newFromText('lorem:ipsum');
        expect(t.getNsText(Title.NS_MEDIAWIKI)).toEqual('MediaWiki');
        expect(t.getNsText(Title.NS_CATEGORY)).toEqual('Category');
        expect(t.getNsText(Title.NS_USER_TALK)).toEqual('User_talk');

        this.parser = new MWParser({language: 'pl'});
        t = Title.newFromText('lorem:ipsum');
        expect(t.getNsText(Title.NS_MEDIAWIKI)).toEqual('MediaWiki');
        expect(t.getNsText(Title.NS_CATEGORY)).toEqual('Kategoria');
        expect(t.getNsText(Title.NS_USER_TALK)).toEqual('Dyskusja_użytkownika');
    });
});


describe('Test getPrefixedText', function() {
    beforeEach(function() {
        this.parser = new MWParser(); // init constants and default config
    });

    it('basic tests', function() {
        let t = Title.newFromText('lorem:ipsum');
        expect(t.getPrefixedText()).toEqual('Lorem:ipsum');

        t = Title.newFromText('lorem:ipsum');
        expect(t.getPrefixedText()).toEqual('Lorem:ipsum');
    });

    it('interwiki tests', function() {
        this.parser = new MWParser({
            validInterwikiNames: ['pl']  // parser changes default config for title
        });

        let t = Title.newFromText('pl:lorem:ipsum');
        expect(t.mInterwiki).toEqual('pl');
        expect(t.getPrefixedText()).toEqual('pl:Lorem:ipsum');
    });

    it('namespace test', function() {
        let t = Title.newFromText('Category:LoremIpsum');
        expect(t.mNamespace).toEqual(Title.NS_CATEGORY);
        expect(t.getPrefixedText()).toEqual('Category:LoremIpsum');
    });
});
