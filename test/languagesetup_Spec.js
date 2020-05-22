/**
 * Tests for src/languagesetup.js.
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


import { LanguageSetup } from '../src/languagesetup.js';
import { Title } from '../src/title.js';
import { MWParser } from '../src/mwparser.js';


describe('LanguageSetup.getNamespaceName()', function() {
    it('basic tests (en)', function() {
        let lang = new LanguageSetup('en');

        expect(lang.getNamespaceName(Title.NS_TALK)).toEqual('Talk');
        expect(lang.getNamespaceName('NS_TALK')).toEqual('Talk');

        expect(lang.getNamespaceName(Title.NS_USER)).toEqual('User');
        expect(lang.getNamespaceName('NS_USER')).toEqual('User');

        expect(lang.getNamespaceName(Title.NS_MEDIA)).toEqual('Media');
        expect(lang.getNamespaceName('NS_MEDIA')).toEqual('Media');

        // wrong numbers / names
        expect(lang.getNamespaceName(Title.NS_CATEGORY_TALK + 10)).toEqual('');
        expect(lang.getNamespaceName(Title.NS_MAIN - 10)).toEqual('');
        expect(lang.getNamespaceName('NS_LOREM_IPSUM')).toEqual('');
    });

    it('basic tests (pl)', function() {
        let lang = new LanguageSetup('pl');

        expect(lang.getNamespaceName(Title.NS_TALK)).toEqual('Dyskusja');
        expect(lang.getNamespaceName('NS_TALK')).toEqual('Dyskusja');

        expect(lang.getNamespaceName(Title.NS_USER)).toEqual('Użytkownik');
        expect(lang.getNamespaceName('NS_USER')).toEqual('Użytkownik');

        expect(lang.getNamespaceName(Title.NS_MEDIA)).toEqual('Media');
        expect(lang.getNamespaceName('NS_MEDIA')).toEqual('Media');

        // wrong numbers / names
        expect(lang.getNamespaceName(Title.NS_CATEGORY_TALK + 10)).toEqual('');
        expect(lang.getNamespaceName(Title.NS_MAIN - 10)).toEqual('');
        expect(lang.getNamespaceName('NS_LOREM_IPSUM')).toEqual('');
    });

    it('project name set or not', function() {
        // project name not set
        let lang = new LanguageSetup('en');

        expect(lang.getNamespaceName(Title.NS_PROJECT)).toEqual('');
        expect(lang.getNamespaceName('NS_PROJECT')).toEqual('');

        expect(lang.getNamespaceName(Title.NS_PROJECT_TALK)).toEqual('');
        expect(lang.getNamespaceName('NS_PROJECT_TALK')).toEqual('');

        // project name set
        lang = new LanguageSetup('en', 'LoremIpsum');

        expect(lang.getNamespaceName(Title.NS_PROJECT)).toEqual('LoremIpsum');
        expect(lang.getNamespaceName('NS_PROJECT')).toEqual('LoremIpsum');

        expect(lang.getNamespaceName(Title.NS_PROJECT_TALK)).toEqual('LoremIpsum_talk');
        expect(lang.getNamespaceName('NS_PROJECT_TALK')).toEqual('LoremIpsum_talk');
    });
});


describe('LanguageSetup.getNamespaceIndex', function() {
    it('basic tests', function() {
        let lang = new LanguageSetup('en');

        expect(lang.getNamespaceIndex('LoremIpsum')).toBeFalsy();
        expect(lang.getNamespaceIndex('File')).toBe(Title.NS_FILE);
        expect(lang.getNamespaceIndex('Talk')).toBe(Title.NS_TALK);
        expect(lang.getNamespaceIndex('User')).toBe(Title.NS_USER);

        lang = new LanguageSetup('pl');

        expect(lang.getNamespaceIndex('LoremIpsum')).toBeFalsy();
        expect(lang.getNamespaceIndex('Plik')).toBe(Title.NS_FILE);
        expect(lang.getNamespaceIndex('Dyskusja')).toBe(Title.NS_TALK);
        expect(lang.getNamespaceIndex('Użytkownik')).toBe(Title.NS_USER);
    });
});


describe('LanguageSetup.getSpecialPageName()', function() {
    it('basic tests (en)', function() {
        let lang = new LanguageSetup('en');
        expect(lang.getSpecialPageName('upload')).toEqual('Special:Upload');

        expect(lang.getSpecialPageName('loremipsum')).toEqual('');
    });

    it('basic tests (pl)', function() {
        let lang = new LanguageSetup('pl');
        expect(lang.getSpecialPageName('upload')).toEqual('Specjalna:Prześlij');

        expect(lang.getSpecialPageName('loremipsum')).toEqual('');
    });
});


describe('LanguageSetup.getSpecialPageTitle', function() {
    it('basic tests', function() {
        let parser = new MWParser();
        let lang = new LanguageSetup('en');

        let result = lang.getSpecialPageTitle('upload', parser.parserConfig);
        expect(result).toBeInstanceOf(Title);
        expect(result.getPrefixedText()).toEqual('Special:Upload');
    });
});


describe('LanguageSetup.getMagicWordDefinition', function() {
    it('Basic tests', function() {
        let lang = new LanguageSetup('en');
        let result = lang.getMagicWordDefinition('redirect');

        expect(result.caseSensitive).toBeFalsy();
        expect(result.synonyms).toEqual(['#REDIRECT']);

        lang = new LanguageSetup('pl');
        result = lang.getMagicWordDefinition('redirect');

        expect(result.caseSensitive).toBeFalsy();
        expect(result.synonyms).toEqual(['#PATRZ', '#PRZEKIERUJ', '#TAM', '#REDIRECT']);
    });
});
