

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
        const par = new MWParser()
        const out = par.handleTables(testTable);

    });

    afterEach(function() {
    });
});








