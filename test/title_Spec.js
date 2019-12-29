describe('Test Title.secureAndSplit', function() {
    it('trim spacer (and _) from start and end', function() {
        let t = new Title();
        t.mDbkeyform = '   lorem ipsum  ';
        t.secureAndSplit();
        expect(t.mDbkeyform).toEqual('lorem_ipsum');

        t.mDbkeyform = '  _ lorem ipsum _ ';
        t.secureAndSplit();
        expect(t.mDbkeyform).toEqual('lorem_ipsum');
    });

    it('namespace test', function() {
        let t = new Title();
        t.mDbkeyform = 'Lorem:ipsum';
        t.secureAndSplit();
        expect(t.mNamespace).toEqual(0);
        expect(t.mDbkeyform).toEqual('Lorem:ipsum');


        t.mDbkeyform = 'File:LoremIpsum';
        t.secureAndSplit();
        expect(t.mNamespace).toEqual(Title.NS_FILE);
        expect(t.mDbkeyform).toEqual('LoremIpsum');
    });

    it('test fragment', function() {
        let t = new Title();
        t.mDbkeyform = 'lorem#ipsum'
        t.secureAndSplit();
        expect(t.mNamespace).toEqual(0);
        expect(t.mDbkeyform).toEqual('lorem');
        expect(t.mFragment).toEqual('ipsum');
    });

    it('basic tests', function() {
        // let t = new Title();
        //t.mDbkeyform = ' title '
        //t.secureAndSplit();

    });
});
