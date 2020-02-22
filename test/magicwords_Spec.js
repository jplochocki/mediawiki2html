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


describe('MagicWords tests', function() {
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
        jasmine.clock().mockDate(new Date(Date.UTC(2020, 1, 22, 18, 01, 02)));

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
        expect(result).toEqual('19:01');

        result = par.magicwords.expandMagicVariable('currenthour');
        expect(result).toEqual('19');

        result = par.magicwords.expandMagicVariable('currentweek');
        expect(result).toEqual('9');

        result = par.magicwords.expandMagicVariable('currentdow');
        expect(result).toEqual('6');

        result = par.magicwords.expandMagicVariable('currenttimestamp');
        expect(result).toEqual('1582394462000');

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
});
