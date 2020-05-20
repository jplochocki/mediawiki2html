/**
 * Tests for src/magicwords.js.
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


import { MWParser } from '../src/mwparser.js';
import { Title } from '../src/title.js';

describe('MagicWords tests', function() {
    it('matchAtStart basic tests', function() {
        let par = new MWParser();
        let result = par.magicwords.matchAtStart('subst:LoremIpsum', ['subst']);
        expect(result).toEqual({matchedWord: 'subst', text: 'LoremIpsum'});

        result = par.magicwords.matchAtStart('subst:LoremIpsum', ['subst1']);
        expect(result).toEqual({matchedWord: false, text: 'subst:LoremIpsum'});

        result = par.magicwords.matchAtStart('subst:LoremIpsum', ['subst', 'safesubst']);
        expect(result).toEqual({matchedWord: 'subst', text: 'LoremIpsum'});

        result = par.magicwords.matchAtStart('sUbSt:LoremIpsum', ['subst']);
        expect(result).toEqual({matchedWord: 'subst', text: 'LoremIpsum'});
    });

    it('matchSubstAtStart basic tests', function() {
        let par = new MWParser();
        let result = par.magicwords.matchSubstAtStart('subst:LoremIpsum');
        expect(result).toEqual({subst: 'subst', text: 'LoremIpsum'});

        result = par.magicwords.matchSubstAtStart('safesubst:LoremIpsum');
        expect(result).toEqual({subst: 'safesubst', text: 'LoremIpsum'});

        result = par.magicwords.matchSubstAtStart('sUbSt:LoremIpsum');
        expect(result).toEqual({subst: 'subst', text: 'LoremIpsum'});

        result = par.magicwords.matchSubstAtStart('substLoremIpsum');
        expect(result).toEqual({subst: false, text: 'substLoremIpsum'});

        result = par.magicwords.matchSubstAtStart('safesubstLoremIpsum');
        expect(result).toEqual({subst: false, text: 'safesubstLoremIpsum'});
    });

    it('expandMagicVariable() date time tests', function() {
        jasmine.clock().install();
        let d = new Date('2/22/2020 6:01:00 PM UTC');
        jasmine.clock().mockDate(d);

        let par = new MWParser();
        let result = par.magicwords.expandMagicVariable('currentmonth');
        expect(result).toEqual('02');

        result = par.magicwords.expandMagicVariable('currentmonth1');
        expect(result).toEqual('2');

        result = par.magicwords.expandMagicVariable('currentmonthname');
        expect(result).toEqual('February');

        result = par.magicwords.expandMagicVariable('currentmonthnamegen');
        expect(result).toEqual('February');

        result = par.magicwords.expandMagicVariable('currentmonthabbrev');
        expect(result).toEqual('Feb');

        result = par.magicwords.expandMagicVariable('currentday');
        expect(result).toEqual('22');

        result = par.magicwords.expandMagicVariable('currentday2');
        expect(result).toEqual('22');

        result = par.magicwords.expandMagicVariable('currentdayname');
        expect(result).toEqual('Saturday');

        result = par.magicwords.expandMagicVariable('currentyear');
        expect(result).toEqual('2020');

        result = par.magicwords.expandMagicVariable('currenttime');
        expect(result).toEqual(`${ d.getHours() }:01`);

        result = par.magicwords.expandMagicVariable('currenthour');
        expect(result).toEqual(d.getHours() + '');

        result = par.magicwords.expandMagicVariable('currentweek');
        expect(result).toEqual('9');

        result = par.magicwords.expandMagicVariable('currentdow');
        expect(result).toEqual('6');

        result = par.magicwords.expandMagicVariable('currenttimestamp');
        expect(result).toEqual(d.toLocaleDateString('en', {year: 'numeric'})
                    + d.toLocaleDateString('en', {month: '2-digit'})
                    + d.toLocaleDateString('en', {day: '2-digit'})
                    + d.toLocaleTimeString('en', {hour: '2-digit', hour12: false})
                    + d.toLocaleTimeString('en', {minute: '2-digit'})
                    + d.toLocaleTimeString('en', {second: '2-digit'}));

        jasmine.clock().uninstall();
    });

    it('expandMagicVariable() page info tests', function() {
        let par = new MWParser({
            pageTitle: 'Template:Lorem Ipsum'
        });
        let result = par.magicwords.expandMagicVariable('pagename');
        expect(result).toEqual('Lorem Ipsum');

        result = par.magicwords.expandMagicVariable('pagenamee');
        expect(result).toEqual('Lorem_Ipsum');

        result = par.magicwords.expandMagicVariable('fullpagename');
        expect(result).toEqual('Template:Lorem Ipsum');

        result = par.magicwords.expandMagicVariable('fullpagenamee');
        expect(result).toEqual('Template:Lorem_Ipsum');

        result = par.magicwords.expandMagicVariable('namespace');
        expect(result).toEqual('Template');

        result = par.magicwords.expandMagicVariable('namespacee');
        expect(result).toEqual('Template');

        result = par.magicwords.expandMagicVariable('namespacenumber');
        expect(result).toEqual(String(Title.NS_TEMPLATE));
    });

    it('expandMagicVariable() title subpage tests', function() {
        let par = new MWParser({
            pageTitle: 'Template:Lorem Ipsum/Dolor'
        });

        let result = par.magicwords.expandMagicVariable('subpagename');
        expect(result).toEqual('Dolor');

        result = par.magicwords.expandMagicVariable('subpagenamee');
        expect(result).toEqual('Dolor');

        result = par.magicwords.expandMagicVariable('basepagename');
        expect(result).toEqual('Lorem Ipsum');

        result = par.magicwords.expandMagicVariable('basepagenamee');
        expect(result).toEqual('Lorem_Ipsum');
    });
});
