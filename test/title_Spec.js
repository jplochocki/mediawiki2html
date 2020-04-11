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


import { Title } from '../src/title.js';


describe('Test Title.secureAndSplit', function() {
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
        let t = new Title({
            validInterwikiNames: ['pl']  // parser changes default config for title
        });

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
        let t = Title.newFromText('lorem:ipsum', {language: 'en'});
        expect(t.getNsIndex('MediaWiki')).toEqual(Title.NS_MEDIAWIKI);
        expect(t.getNsIndex('Category')).toEqual(Title.NS_CATEGORY);
        expect(t.getNsIndex('User_talk')).toEqual(Title.NS_USER_TALK);

        t = Title.newFromText('lorem:ipsum', {language: 'pl'});
        expect(t.getNsIndex('MediaWiki')).toEqual(Title.NS_MEDIAWIKI);
        expect(t.getNsIndex('Kategoria')).toEqual(Title.NS_CATEGORY);
        expect(t.getNsIndex('Dyskusja_użytkownika')).toEqual(Title.NS_USER_TALK);
    });
});


describe('Test Title.getNsText', function() {
    it('basic tests', function() {
        let t = Title.newFromText('lorem:ipsum', {language: 'en'});
        expect(t.getNsText(Title.NS_MEDIAWIKI)).toEqual('MediaWiki');
        expect(t.getNsText(Title.NS_CATEGORY)).toEqual('Category');
        expect(t.getNsText(Title.NS_USER_TALK)).toEqual('User_talk');

        t = Title.newFromText('lorem:ipsum', {language: 'pl'});
        expect(t.getNsText(Title.NS_MEDIAWIKI)).toEqual('MediaWiki');
        expect(t.getNsText(Title.NS_CATEGORY)).toEqual('Kategoria');
        expect(t.getNsText(Title.NS_USER_TALK)).toEqual('Dyskusja_użytkownika');
    });
});


describe('Test Title.getPrefixedText', function() {
    it('basic tests', function() {
        let t = Title.newFromText('lorem:ipsum');
        expect(t.getPrefixedText()).toEqual('Lorem:ipsum');

        t = Title.newFromText('lorem:ipsum');
        expect(t.getPrefixedText()).toEqual('Lorem:ipsum');
    });

    it('interwiki tests', function() {
        let t = Title.newFromText('pl:lorem:ipsum', {validInterwikiNames: ['pl']});
        expect(t.mInterwiki).toEqual('pl');
        expect(t.getPrefixedText()).toEqual('pl:Lorem:ipsum');
    });

    it('namespace test', function() {
        let t = Title.newFromText('Category:LoremIpsum');
        expect(t.mNamespace).toEqual(Title.NS_CATEGORY);
        expect(t.getPrefixedText()).toEqual('Category:LoremIpsum');
    });
});


describe('Test Title.getFullURL', function() {
    it('basic tests', function() {
        const t = Title.newFromText('Lorem:ipsum');
        expect(t.getFullURL()).toEqual('//en.wikipedia.org/w/index.php?title=Lorem%3Aipsum');
        expect(t.getFullURL({action: 'edit'})).toEqual('//en.wikipedia.org/w/index.php?title=Lorem%3Aipsum&action=edit');
        expect(t.getFullURL({action: 'edit', redlink: 1})).toEqual('//en.wikipedia.org/w/index.php?title=Lorem%3Aipsum&action=edit&redlink=1');
    });

    it('interwiki changed test', function() {
        const t = Title.newFromText('pl:Lorem:ipsum', {validInterwikiNames: ['pl']});
        expect(t.getFullURL()).toEqual('//pl.wikipedia.org/w/index.php?title=Lorem%3Aipsum');
        expect(t.getFullURL({action: 'edit'})).toEqual('//pl.wikipedia.org/w/index.php?title=Lorem%3Aipsum&action=edit');
        expect(t.getFullURL({action: 'edit', redlink: 1})).toEqual('//pl.wikipedia.org/w/index.php?title=Lorem%3Aipsum&action=edit&redlink=1');
    });
});


describe('Test Title.getEditURL', function() {
    it('basic tests', function() {
        const t = Title.newFromText('Lorem:ipsum');
        expect(t.getEditURL()).toEqual('//en.wikipedia.org/w/index.php?title=Lorem%3Aipsum&action=edit');
    });
});


describe('Test Title.getImageUrl', function() {
    it('basic tests', function() {
        const t = Title.newFromText('File:LoremIpsum.png');
        expect(t.getImageUrl()).toEqual('/images/a/af/LoremIpsum.png');
    });
});


describe('Test Title.getThumbUrl', function() {
    it('basic tests', function() {
        const t = Title.newFromText('File:LoremIpsum.png');
        expect(t.getThumbUrl(150)).toEqual('/images/thumb/a/af/LoremIpsum.png/150px-LoremIpsum.png');
    });
});


describe('Test Title.getImageUploadUrl', function() {
    it('basic tests', function() {
        const t = Title.newFromText('File:LoremIpsum.png');
        expect(t.getImageUploadUrl()).toEqual('//en.wikipedia.org/w/index.php?title=Special%3AUpload&wpDestFile=LoremIpsum.png');
    });
});


describe('Test Title.getSubpageText()', function() {
    it('basic tests', function() {
        let title = Title.newFromText('User:Lorem/Ipsum/Dolor');
        expect(title.getSubpageText()).toEqual('Dolor');

        // no subpages in title
        title = Title.newFromText('User:Lorem');
        expect(title.getSubpageText()).toEqual('Lorem');

        // namespace without subpages support
        title = Title.newFromText('File:Lorem/Ipsum/Dolor');
        expect(title.getSubpageText()).toEqual('Lorem/Ipsum/Dolor');
    });
});


describe('Test Title.getSubpage()', function() {
    it('basic tests', function() {
        let title = Title.newFromText('User:Lorem/Ipsum/Dolor');
        let title2 = title.getSubpage('Sit');

        expect(title2).toEqual(jasmine.any(Title));

        expect(title.getSubpageText()).toEqual('Dolor');
        expect(title2.getSubpageText()).toEqual('Sit');

        expect(title.getPrefixedText()).toEqual('User:Lorem/Ipsum/Dolor');
        expect(title2.getPrefixedText()).toEqual('User:Lorem/Ipsum/Dolor/Sit');
    });
});


describe('Test Title.getSubpages()', function() {
    it('title with subpages', function() {
        let subpages = Title.newFromText('User:Lorem/Ipsum/Dolor/Sit/Amet').getSubpages();

        expect(subpages).toEqual(jasmine.any(Array));
        expect(subpages.length).toEqual(4);

        let expectedSubpages = [
            'User:Lorem/Ipsum',
            'User:Lorem/Ipsum/Dolor',
            'User:Lorem/Ipsum/Dolor/Sit',
            'User:Lorem/Ipsum/Dolor/Sit/Amet',
        ];

        subpages.forEach(subpage => {
            expect(subpage).toEqual(jasmine.any(Title));
            expect(expectedSubpages).toContain(subpage.getPrefixedText());
        });

        // no subpages in title
        let title = Title.newFromText('User:Lorem');
        expect(title.getSubpageText()).toEqual('Lorem');

        // namespace without subpages support
        title = Title.newFromText('File:Lorem/Ipsum/Dolor');
    });

    it('title without subpages or namespace without subpages', function() {
        let subpages = Title.newFromText('User:Lorem').getSubpages();

        expect(subpages).toEqual(jasmine.any(Array));
        expect(subpages.length).toEqual(0);

        // namespace without subpages support
        subpages = Title.newFromText('File:Lorem/Ipsum/Dolor').getSubpages();

        expect(subpages).toEqual(jasmine.any(Array));
        expect(subpages.length).toEqual(0);
    });
});


describe('Test Title.hasSubpages()', function() {
    it('basic tests', function() {
        let title = Title.newFromText('User:Lorem/Ipsum/Dolor/Sit/Amet');
        expect(title.hasSubpages()).toBeTruthy();

        // title without subpages
        title = Title.newFromText('User:Lorem');
        expect(title.hasSubpages()).toBeFalsy();

        // namespace without subpages support
        title = Title.newFromText('File:Lorem/Ipsum/Dolor');
        expect(title.hasSubpages()).toBeFalsy();
    });
});

describe('Test Title.getBaseText()', function() {
    it('basic tests', function() {
        let title = Title.newFromText('User:Lorem/Ipsum/Dolor/Sit/Amet');
        expect(title.getBaseText()).toEqual('Lorem/Ipsum/Dolor/Sit');

        title = Title.newFromText('User:Lorem/Ipsum');
        expect(title.getBaseText()).toEqual('Lorem');

        // title without subpages
        title = Title.newFromText('User:Lorem');
        expect(title.getBaseText()).toEqual('Lorem');

        // namespace without subpages support
        title = Title.newFromText('File:Lorem/Ipsum/Dolor');
        expect(title.getBaseText()).toEqual('Lorem/Ipsum/Dolor');
    });

});
