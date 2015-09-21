import { Editor } from 'content-kit-editor';
import Helpers from '../test-helpers';
import { MOBILEDOC_VERSION } from 'content-kit-editor/renderers/mobiledoc';

const { test, module } = Helpers;

let fixture, editor, editorElement;

const mobileDocWith2Sections = {
  version: MOBILEDOC_VERSION,
  sections: [
    [],
    [
      [1, "P", [
        [[], 0, "first section"]
      ]],
      [1, "P", [
        [[], 0, "second section"]
      ]]
    ]
  ]
};

module('Acceptance: Editor Selections', {
  beforeEach() {
    fixture = document.getElementById('qunit-fixture');
    editorElement = document.createElement('div');
    editorElement.setAttribute('id', 'editor');
    fixture.appendChild(editorElement);
  },

  afterEach() {
    if (editor) { editor.destroy(); }
  }
});

test('selecting across sections is possible', (assert) => {
  const done = assert.async();

  editor = new Editor({mobiledoc: mobileDocWith2Sections});
  editor.render(editorElement);

  let firstSection = $('p:contains(first section)')[0];
  let secondSection = $('p:contains(second section)')[0];

  Helpers.dom.selectText('section', firstSection,
                         'second', secondSection);

  Helpers.dom.triggerEvent(document, 'mouseup');

  setTimeout(() => {
    assert.equal(editor.activeSections.length, 2, 'selects 2 sections');
    done();
  });
});

test('selecting an entire section and deleting removes it', (assert) => {
  const done = assert.async();

  editor = new Editor({mobiledoc: mobileDocWith2Sections});
  editor.render(editorElement);

  Helpers.dom.selectText('second section', editorElement);
  Helpers.dom.triggerDelete(editor);

  assert.hasElement('#editor p:contains(first section)');
  assert.hasNoElement('#editor p:contains(second section)', 'deletes contents of second section');
  assert.equal($('#editor p').length, 2, 'still has 2 sections');

  Helpers.dom.insertText(editor, 'X');

  assert.hasElement('#editor p:eq(1):contains(X)', 'inserts text in correct spot');

  done();
});

test('selecting text in a section and deleting deletes it', (assert) => {
  editor = new Editor({mobiledoc: mobileDocWith2Sections});
  editor.render(editorElement);

  Helpers.dom.selectText('cond sec', editorElement);
  Helpers.dom.triggerDelete(editor);

  assert.hasElement('#editor p:contains(first section)', 'first section unchanged');
  assert.hasNoElement('#editor p:contains(second section)', 'second section is no longer there');
  assert.hasElement('#editor p:contains(setion)', 'second section has correct text');

  Helpers.dom.insertText(editor, 'Z');
  assert.hasElement('#editor p:contains(seZtion)', 'text inserted correctly');
});

test('selecting text across sections and deleting joins sections', (assert) => {
  editor = new Editor({mobiledoc: mobileDocWith2Sections});
  editor.render(editorElement);

  const firstSection = $('#editor p')[0],
        secondSection = $('#editor p')[1];

  Helpers.dom.selectText('t section', firstSection,
                         'second s', secondSection);
  Helpers.dom.triggerDelete(editor);

  assert.hasElement('p:contains(firsection)');
  assert.hasNoElement('p:contains(first section)');
  assert.hasNoElement('p:contains(second section)');
  assert.equal($('#editor p').length, 1, 'only 1 section after deleting to join');
});

test('selecting text across markers and deleting joins markers', (assert) => {
  const done = assert.async();

  editor = new Editor({mobiledoc: mobileDocWith2Sections});
  editor.render(editorElement);

  Helpers.dom.selectText('rst sect', editorElement);
  Helpers.dom.triggerEvent(document, 'mouseup');

  setTimeout(() => {
    Helpers.toolbar.clickButton(assert, 'bold');

    let firstTextNode = editorElement
                           .childNodes[0] // p
                           .childNodes[1] // b
                           .childNodes[0]; // textNode containing "rst sect"
    let secondTextNode = editorElement
                             .childNodes[0] // p
                             .childNodes[2]; // textNode containing "ion"

    assert.equal(firstTextNode.textContent, 'rst sect', 'correct first text node');
    assert.equal(secondTextNode.textContent, 'ion', 'correct second text node');
    Helpers.dom.selectText('t sect', firstTextNode,
                           'ion',    secondTextNode);
    Helpers.dom.triggerDelete(editor);

    assert.hasElement('p:contains(firs)', 'deletes across markers');
    assert.hasElement('strong:contains(rs)', 'maintains bold text');

    firstTextNode = editorElement
                      .childNodes[0] // p
                      .childNodes[1] // b
                      .childNodes[0]; // textNode now containing "rs"

    assert.deepEqual(Helpers.dom.getCursorPosition(),
                     {node: firstTextNode, offset: 2});

    done();
  });
});

test('select text and apply markup multiple times', (assert) => {
  const done = assert.async();
  editor = new Editor({mobiledoc: mobileDocWith2Sections});
  editor.render(editorElement);

  Helpers.dom.selectText('t sect', editorElement);
  Helpers.dom.triggerEvent(document, 'mouseup');

  setTimeout(() => {
    Helpers.toolbar.clickButton(assert, 'bold');

    Helpers.dom.selectText('fir', editorElement);
    Helpers.dom.triggerEvent(document, 'mouseup');

    setTimeout(() => {
      Helpers.toolbar.clickButton(assert, 'bold');

      assert.hasElement('p:contains(first section)', 'correct first section');
      assert.hasElement('strong:contains(fir)', 'strong "fir"');
      assert.hasElement('strong:contains(t sect)', 'strong "t sect"');

      done();
    });
  });
});

test('selecting text across markers deletes intermediary markers', (assert) => {
  const done = assert.async();
  editor = new Editor({mobiledoc: mobileDocWith2Sections});
  editor.render(editorElement);

  Helpers.dom.selectText('rst sec', editorElement);
  Helpers.dom.triggerEvent(document, 'mouseup');

  setTimeout(() => {
    Helpers.toolbar.clickButton(assert, 'bold');

    const textNode1 = editorElement.childNodes[0].childNodes[0],
          textNode2 = editorElement.childNodes[0].childNodes[2];
    Helpers.dom.selectText('i', textNode1,
                           'tio', textNode2);
    Helpers.dom.triggerEvent(document, 'mouseup');

    setTimeout(() => {
      Helpers.dom.triggerDelete(editor);

      assert.hasElement('p:contains(fn)', 'has remaining first section');
      assert.deepEqual(Helpers.dom.getCursorPosition(),
                       {node: editorElement.childNodes[0].childNodes[0],
                         offset: 1});

      done();
    });
  });
});

test('selecting text across markers preserves node after', (assert) => {
  const done = assert.async();
  editor = new Editor({mobiledoc: mobileDocWith2Sections});
  editor.render(editorElement);

  Helpers.dom.selectText('rst sec', editorElement);
  Helpers.dom.triggerEvent(document, 'mouseup');

  setTimeout(() => {
    Helpers.toolbar.clickButton(assert, 'bold');

    const textNode1 = editorElement.childNodes[0].childNodes[0],
          textNode2 = editorElement.childNodes[0].childNodes[1];
    Helpers.dom.selectText('i', textNode1,
                           'sec', textNode2);
    Helpers.dom.triggerEvent(document, 'mouseup');

    setTimeout(() => {
      Helpers.dom.triggerDelete(editor);

      assert.deepEqual(
        editorElement.childNodes[0].innerHTML, 'ftion',
        'has remaining first section'
      );
      assert.deepEqual(Helpers.dom.getCursorPosition(),
                       {node: editorElement.childNodes[0].childNodes[0],
                         offset: 1});
      done();
    });
  });
});

test('selecting text across sections and hitting enter deletes and moves cursor to last selected section', (assert) => {
  const done = assert.async();
  editor = new Editor({mobiledoc: mobileDocWith2Sections});
  editor.render(editorElement);

  let firstSection = $('#editor p:eq(0)')[0],
      secondSection = $('#editor p:eq(1)')[0];

  Helpers.dom.selectText(' section', firstSection,
                         'second ', secondSection);

  Helpers.dom.triggerEnter(editor);

  setTimeout(() => {
    assert.equal($('#editor p').length, 2, 'still 2 sections');
    assert.equal($('#editor p:eq(0)').text(), 'first', 'correct text in 1st section');
    assert.equal($('#editor p:eq(1)').text(), 'section', 'correct text in 2nd section');

    let secondSectionTextNode = editor.element.childNodes[1].childNodes[0];
    assert.deepEqual(Helpers.dom.getCursorPosition(),
                    {node: secondSectionTextNode, offset: 0},
                    'cursor is at start of second section');
    done();
  });
});

test('keystroke of printable character while text is selected deletes the text', (assert) => {
  const done = assert.async();
  editor = new Editor({mobiledoc: mobileDocWith2Sections});
  editor.render(editorElement);

  Helpers.dom.selectText('first section', editorElement);
  Helpers.dom.triggerEvent(document, 'mouseup');

  setTimeout(() => {
    Helpers.toolbar.clickButton(assert, 'heading');

    assert.ok($('#editor h2:contains(first section)').length,
              'first section is a heading');

    const firstSectionTextNode = editorElement.childNodes[0].childNodes[0];
    const secondSectionTextNode = editorElement.childNodes[1].childNodes[0];
    Helpers.dom.selectText('section', firstSectionTextNode,
                          'secon', secondSectionTextNode);

    Helpers.dom.insertText(editor, 'X');

    assert.ok($(`#editor h2:contains(first Xd section)`).length,
              'updates the section');

    done();
  });
});

test('selecting all text across sections and hitting enter deletes and moves cursor to empty section', (assert) => {
  const done = assert.async();
  editor = new Editor({mobiledoc: mobileDocWith2Sections});
  editor.render(editorElement);

  let firstSection = $('#editor p:eq(0)')[0],
      secondSection = $('#editor p:eq(1)')[0];

  Helpers.dom.selectText('first section', firstSection,
                         'second section', secondSection);

  Helpers.dom.triggerEnter(editor);

  setTimeout(() => {
    assert.equal($('#editor p').length, 1, 'single section');
    assert.equal($('#editor p:eq(0)').text(), '', 'blank text');

    assert.deepEqual(Helpers.dom.getCursorPosition(),
                    {node: $('#editor p')[0], offset: 0},
                    'cursor is at start of second section');
    done();
  });
});

test('selecting text across markup and list sections', (assert) => {
  const done = assert.async();
  const build = Helpers.mobiledoc.build;
  const mobiledoc = build(({post, markupSection, listSection, listItem, marker}) =>
    post([
      markupSection('p', [marker('abc')]),
      listSection('ul', [
        listItem([marker('123')]),
        listItem([marker('456')])
      ])
    ])
  );
  editor = new Editor({mobiledoc});
  editor.render(editorElement);

  Helpers.dom.selectText('bc', editorElement, '12', editorElement);
  Helpers.dom.triggerEvent(document, 'mouseup');

  setTimeout(() => {
    Helpers.dom.triggerDelete(editor);

    assert.hasElement('#editor p:contains(a3)',
                      'combines partially-selected list item onto markup section');

    assert.hasNoElement('#editor p:contains(bc)', 'deletes selected text "bc"');
    assert.hasNoElement('#editor p:contains(12)', 'deletes selected text "12"');

    assert.hasElement('#editor li:contains(6)', 'leaves remaining text in list item');
    done();
  });
});

test('selecting text that covers a list section', (assert) => {
  const done = assert.async();
  const build = Helpers.mobiledoc.build;
  const mobiledoc = build(({post, markupSection, listSection, listItem, marker}) =>
    post([
      markupSection('p', [marker('abc')]),
      listSection('ul', [
        listItem([marker('123')]),
        listItem([marker('456')])
      ]),
      markupSection('p', [marker('def')])
    ])
  );
  editor = new Editor({mobiledoc});
  editor.render(editorElement);

  Helpers.dom.selectText('bc', editorElement, 'de', editorElement);
  Helpers.dom.triggerEvent(document, 'mouseup');

  setTimeout(() => {
    Helpers.dom.triggerDelete(editor);

    assert.hasElement('#editor p:contains(af)',
                      'combines sides of selection');

    assert.hasNoElement('#editor li:contains(123)', 'deletes li 1');
    assert.hasNoElement('#editor li:contains(456)', 'deletes li 2');
    assert.hasNoElement('#editor ul', 'removes ul');

    done();
  });
});

test('selecting text that starts in a list item and ends in a markup section', (assert) => {
  const done = assert.async();
  const build = Helpers.mobiledoc.build;
  const mobiledoc = build(({post, markupSection, listSection, listItem, marker}) =>
    post([
      listSection('ul', [
        listItem([marker('123')]),
        listItem([marker('456')])
      ]),
      markupSection('p', [marker('def')])
    ])
  );
  editor = new Editor({mobiledoc});
  editor.render(editorElement);

  Helpers.dom.selectText('23', editorElement, 'de', editorElement);
  Helpers.dom.triggerEvent(document, 'mouseup');

  setTimeout(() => {
    Helpers.dom.triggerDelete(editor);

    assert.hasElement('#editor li:contains(1f)',
                      'combines sides of selection');

    assert.hasNoElement('#editor li:contains(123)', 'deletes li 1');
    assert.hasNoElement('#editor li:contains(456)', 'deletes li 2');
    assert.hasNoElement('#editor p:contains(def)', 'deletes p content');
    assert.hasNoElement('#editor p', 'removes p entirely');

    done();
  });
});

test('selecting text that includes a card section and deleting deletes card section', (assert) => {
  const done = assert.async();
  const build = Helpers.mobiledoc.build;
  const mobiledoc = build(({post, markupSection, cardSection, marker}) =>
    post([
      markupSection('p', [marker('abc')]),
      cardSection('simple-card'),
      markupSection('p', [marker('def')])
    ])
  );
  const cards = [{
    name: 'simple-card',
    display: {
      setup(element) {
        const span = document.createElement('span');
        span.setAttribute('id', 'card-el');
        element.appendChild(span);
      }
    }
  }];
  editor = new Editor({mobiledoc, cards});
  editor.render(editorElement);

  assert.hasElement('#card-el', 'precond - card el is rendered');

  Helpers.dom.selectText('bc', editorElement, 'de', editorElement);
  Helpers.dom.triggerEvent(document, 'mouseup');

  setTimeout(() => {
    Helpers.dom.triggerDelete(editor);

    assert.hasElement('#editor p:contains(af)', 'combines sides of selection');

    assert.hasNoElement('#editor span#card-el', 'card el is removed');
    assert.hasNoElement('#editor p:contains(abc)', 'previous section 1 is removed');
    assert.hasNoElement('#editor p:contains(def)', 'previous section 2 is removed');

    done();
  });
});

test('selecting text that touches bold text should not be considered bold by the toolbar', (assert) => {
  const done = assert.async();

  const mobiledoc = Helpers.mobiledoc.build(({post, markupSection, marker}) => {
    return post([markupSection('p', [marker('abc')])]);
  });
  editor = new Editor({mobiledoc});
  editor.render(editorElement);

  Helpers.dom.selectText('b', editorElement);
  Helpers.dom.triggerEvent(document, 'mouseup');

  setTimeout(() => {
    Helpers.toolbar.clickButton(assert, 'bold');

    assert.hasElement('#editor strong:contains(b)', 'precond - bold text');

    Helpers.dom.selectText('c', editorElement);
    Helpers.dom.triggerEvent(document, 'mouseup');

    setTimeout(() => {
      assert.inactiveButton('bold', 'when selecting text next to bold text, bold button is inactive');
      done();
    });
  });
});

// https://github.com/bustlelabs/content-kit-editor/issues/121
test('selecting text that includes a 1-character marker and unbolding it', (assert) => {
  const done = assert.async();

  const mobiledoc = Helpers.mobiledoc.build(({post, markupSection, marker, markup}) => {
    const b = markup('strong');
    return post([markupSection('p', [
      marker('a'),
      marker('b',[b]),
      marker('c')
    ])]);
  });
  editor = new Editor({mobiledoc});
  editor.render(editorElement);

  assert.hasElement('#editor strong:contains(b)', 'precond - bold');

  Helpers.dom.selectText('b', editorElement, 'c', editorElement);
  Helpers.dom.triggerEvent(document, 'mouseup');

  setTimeout(() => {
    assert.activeButton('bold');
    Helpers.toolbar.clickButton(assert, 'bold');

    assert.hasNoElement('#editor strong', 'bold text is unboldened');

    done();
  });
});

// see https://github.com/bustlelabs/content-kit-editor/issues/128
test('selecting text that includes an empty section and applying markup to it', (assert) => {
  const done = assert.async();
  const mobiledoc = Helpers.mobiledoc.build(({post, markupSection, marker}) => {
    return post([
      markupSection('p', [marker('abc')]),
      markupSection('p')
    ]);
  });
  editor = new Editor({mobiledoc});
  editor.render(editorElement);

  // precond
  assert.hasElement('#editor p:contains(abc)');
  assert.ok($('#editor p:eq(1)').text() === '', 'no text in second p');
  const t1 = $('#editor p:eq(0)')[0].childNodes[0];
  assert.equal(t1.textContent, 'abc', 'correct text node');
  const p2 = $('#editor p:eq(1)')[0];

  Helpers.dom.moveCursorTo(t1, 0, p2, 0);
  Helpers.dom.triggerEvent(document, 'mouseup');

  setTimeout(() => {
    assert.toolbarVisible();
    Helpers.toolbar.clickButton(assert, 'bold');

    assert.hasElement('#editor p strong:contains(abc)', 'bold is applied to text');
    done();
  });
});

// see https://github.com/bustlelabs/content-kit-editor/issues/155
test('editor#selectSections works when given an empty array', (assert) => {
  const mobiledoc = Helpers.mobiledoc.build(({post, markupSection, marker}) => {
    return post([markupSection('p', [marker('abc')])]);
  });
  editor = new Editor({mobiledoc});
  editor.render(editorElement);

  assert.selectedText('', 'precond - no text selected');

  const section = editor.post.sections.head;
  editor.selectSections([section]);

  assert.selectedText('abc', 'section is selected');
  editor.selectSections([]);
  assert.selectedText(null, 'no text selected after selecting no sections');
});
