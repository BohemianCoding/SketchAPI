/* globals expect, test */
/* eslint-disable no-param-reassign */

import { SymbolMaster, Text, Artboard } from '../../'

function createSymbolMaster(document) {
  const artboard = new Artboard({
    name: 'Test',
    parent: document.selectedPage,
  })
  const text = new Text({
    text: 'Test value',
    parent: artboard,
  })

  // build the symbol master
  return {
    master: SymbolMaster.fromArtboard(artboard),
    text,
    artboard,
  }
}

test('should create a symbol master from an artboard', (context, document) => {
  // build the symbol master
  const { master } = createSymbolMaster(document)
  expect(master.type).toBe('SymbolMaster')

  expect(document.getLayerNamed).toBeDefined()
  expect(document.getSymbolMasterWithID(master.symbolId)).toEqual(master)
})

test('should create a symbol instance from a master', (context, document) => {
  // build the symbol master
  const { master } = createSymbolMaster(document)

  expect(master.getAllInstances()).toEqual([])

  // create an instance
  const instance = master.createNewInstance()
  expect(instance.type).toBe('SymbolInstance')
  expect(instance.master).toBe(null)
  // by default, it's not anywhere in the document
  expect(master.getAllInstances()).toEqual([])

  // add the instance to the page
  document.selectedPage.layers = document.selectedPage.layers.concat(instance)
  expect(master.getAllInstances()).toEqual([instance])
  expect(instance.master).toEqual(master)
})

test('should have overrides', (context, document) => {
  const { master, text } = createSymbolMaster(document)
  const instance = master.createNewInstance()
  document.selectedPage.layers = document.selectedPage.layers.concat(instance)

  expect(instance.overrides.length).toBe(1)
  const override = instance.overrides[0]
  expect(override.toJSON()).toEqual({
    id: `${text.id}_stringValue`,
    path: text.id,
    property: 'stringValue',
    symbolOverride: false,
    value: 'Test value',
    isDefault: true,
  })
})

test('should be able to set overrides', (context, document) => {
  const { master, text } = createSymbolMaster(document)
  const instance = master.createNewInstance()
  document.selectedPage.layers = document.selectedPage.layers.concat(instance)

  expect(instance.overrides.length).toBe(1)
  const override = instance.overrides[0]
  override.value = 'overridden'

  expect(instance.overrides.length).toBe(1)
  expect(instance.overrides[0].toJSON()).toEqual({
    id: `${text.id}_stringValue`,
    path: text.id,
    property: 'stringValue',
    symbolOverride: false,
    value: 'overridden',
    isDefault: false,
  })
})

test(
  'should create a symbol master with a nested symbol',
  (context, document) => {
    // build the first symbol master
    const { master: nestedMaster, text } = createSymbolMaster(document)

    const artboard = new Artboard({
      name: 'Test2',
      parent: document.selectedPage,
    })
    const text2 = new Text({
      text: 'Test value 2',
    })
    const nestedInstance = nestedMaster.createNewInstance()
    artboard.layers = [nestedInstance, text2]

    const master = SymbolMaster.fromArtboard(artboard)

    const instance = master.createNewInstance()

    // add the instance to the page
    document.selectedPage.layers = document.selectedPage.layers.concat(instance)
    expect(instance.overrides.length).toBe(3)
    expect(instance.overrides[0].toJSON()).toEqual({
      id: `${nestedInstance.id}_symbolID`,
      path: nestedInstance.id,
      property: 'symbolID',
      symbolOverride: true,
      value: nestedInstance.symbolId,
      isDefault: true,
    })
    expect(instance.overrides[1].toJSON()).toEqual({
      id: `${text2.id}_stringValue`,
      path: text2.id,
      property: 'stringValue',
      symbolOverride: false,
      value: 'Test value 2',
      isDefault: true,
    })
    expect(instance.overrides[2].toJSON()).toEqual({
      id: `${nestedInstance.id}/${text.id}_stringValue`,
      path: `${nestedInstance.id}/${text.id}`,
      property: 'stringValue',
      symbolOverride: false,
      value: 'Test value',
      isDefault: true,
    })
  }
)

test('should change a nested symbol', (context, document) => {
  // build the first symbol master
  const { master: nestedMaster } = createSymbolMaster(document)
  const { master: nestedMaster2 } = createSymbolMaster(document)

  const artboard = new Artboard({
    name: 'Test2',
    parent: document.selectedPage,
  })
  const text2 = new Text({
    text: 'Test value 2',
  })
  const nestedInstance = nestedMaster.createNewInstance()
  artboard.layers = [nestedInstance, text2]

  const master = SymbolMaster.fromArtboard(artboard)

  const instance = master.createNewInstance()

  // add the instance to the page
  document.selectedPage.layers = document.selectedPage.layers.concat(instance)
  expect(instance.overrides.length).toBe(3)

  const override = instance.overrides[0]
  override.value = nestedMaster2.symbolId

  expect(instance.overrides[0].toJSON()).toEqual({
    id: `${nestedInstance.id}_symbolID`,
    path: nestedInstance.id,
    property: 'symbolID',
    symbolOverride: true,
    value: nestedMaster2.symbolId,
    isDefault: false,
  })
})
