

describe('Testy handleTables()', function() {
    beforeEach(function() {
        // jasmine.clock().install();
        // jasmine.clock().mockDate(new Date(Date.UTC(2018, 7, 11)));
        // spyOn(window, 'getWikiPageText').and.returnValue(Promise.resolve());
    });

    it('test wyznaczania prawidłowej strony pamiętnika', function() {
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
        const par = new MWParser()
        const out = par.handleTables(testTable);
        console.log(out);
        // getDiaryYearText();
        // expect(getWikiPageText).toHaveBeenCalledWith('Pamiętnik 2018');
    });

    afterEach(function() {
        // jasmine.clock().uninstall();
    });
});
