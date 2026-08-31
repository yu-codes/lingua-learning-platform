/**
 * System instances
 * Each language declares its systems here; the shared factories do the work.
 */

const EnglishVocabulary = VocabSystem.create({
    global: 'EnglishVocabulary',
    route: 'english/vocabulary',
    base: 'english/vocabulary/data',
    ttsLang: 'en-US',
    langName: '英語',
    label: '核心單字',
    hasReading: false,
    searchHint: '搜尋單字或中文',
    blurb: '每個單字都附詞性、中文解釋與例句，可逐字或整句發音。'
});

const EnglishGrammar = GrammarSystem.create({
    global: 'EnglishGrammar',
    route: 'english/grammar',
    base: 'english/grammar/data',
    ttsLang: 'en-US',
    langName: '英語',
    label: '讓人多益滿分的句型與文法',
    shortLabel: '多益文法',
    trapLabel: '多益陷阱',
    blurb: '從句子結構一路到長句閱讀與應試策略，每個單元都有對照表、例句與自我檢測題。'
});

const JapaneseVocabulary = VocabSystem.create({
    global: 'JapaneseVocabulary',
    route: 'japanese/vocabulary',
    base: 'japanese/vocabulary/data',
    ttsLang: 'ja-JP',
    langName: '日語',
    label: '核心單字',
    hasReading: true,
    searchHint: '搜尋漢字、假名、羅馬字或中文',
    blurb: '每個單字都標注假名與羅馬字，附詞性、中文解釋與例句，可逐字或整句發音。'
});

const JapaneseGrammar = GrammarSystem.create({
    global: 'JapaneseGrammar',
    route: 'japanese/grammar',
    base: 'japanese/grammar/data',
    ttsLang: 'ja-JP',
    langName: '日語',
    label: '日語文法體系',
    shortLabel: '日語文法',
    trapLabel: '常見錯誤',
    blurb: '從助詞與動詞變化一路到敬語與長句閱讀，每個單元都有對照表、例句與自我檢測題。'
});

const JapaneseThematic = ThematicSystem.create({
    global: 'JapaneseThematic',
    route: 'japanese/thematic',
    base: 'japanese/thematic/data',
    ttsLang: 'ja-JP',
    langName: '日語',
    label: '主題式日語學習系統',
    shortLabel: '主題式日語',
    blurb: '依照生活場景分類的實用日語句型，每句都附假名與中譯，可單句或整組播放。'
});
