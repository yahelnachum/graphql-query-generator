import { generateRandomQuery } from '../src/index'
import { buildSchema, validate, print } from 'graphql'
import * as dedent from 'dedent'

test(`Ignore arguments when no @listSize is used`, () => {
  const schema = buildSchema(`
    directive @listSize(requireOneSlicingArgument: Boolean = true, assumedSize: Int, slicingArguments: [String], sizedFields: [String]) on FIELD_DEFINITION

    type Order {
      id: ID
      date: String
    }

    type Query {
      orders(first: Int, after: ID, last: Int, before: ID): [Order]
    }
  `)
  const { queryDocument } = generateRandomQuery(schema, { seed: 1 })
  const query = print(queryDocument)
  expect(query.trim()).toEqual(
    dedent(`
      query RandomQuery {
        orders {
          id
          date
        }
      }
    `).trim()
  )
  expect(validate(schema, queryDocument)).toEqual([])
})

test(`Add "first" slicing argument when defined in @listSize`, () => {
  const schema = buildSchema(`
    directive @listSize(requireOneSlicingArgument: Boolean = true, assumedSize: Int, slicingArguments: [String], sizedFields: [String]) on FIELD_DEFINITION

    type Order {
      id: ID
      date: String
    }

    type Query {
      orders(first: Int, after: ID, last: Int, before: ID): [Order] @listSize(slicingArguments: ["first"])
    }
  `)
  const { queryDocument } = generateRandomQuery(schema, { seed: 1 })
  const query = print(queryDocument)
  expect(query.trim()).toEqual(
    dedent(`
      query RandomQuery($Query__orders__first: Int) {
        orders(first: $Query__orders__first) {
          id
          date
        }
      }
    `).trim()
  )
  expect(validate(schema, queryDocument)).toEqual([])
})

test(`Add "last" slicing argument when defined in @listSize`, () => {
  const schema = buildSchema(`
    directive @listSize(requireOneSlicingArgument: Boolean = true, assumedSize: Int, slicingArguments: [String], sizedFields: [String]) on FIELD_DEFINITION

    type Order {
      id: ID
      date: String
    }

    type Query {
      orders(first: Int, after: ID, last: Int, before: ID): [Order] @listSize(slicingArguments: ["last"])
    }
  `)
  const { queryDocument } = generateRandomQuery(schema, { seed: 1 })
  const query = print(queryDocument)
  expect(query.trim()).toEqual(
    dedent(`
      query RandomQuery($Query__orders__last: Int) {
        orders(last: $Query__orders__last) {
          id
          date
        }
      }
    `).trim()
  )
  expect(validate(schema, queryDocument)).toEqual([])
})

test(`Ignore @listSize when no slicing argument is defined in @listSize`, () => {
  const schema = buildSchema(`
    directive @listSize(requireOneSlicingArgument: Boolean = true, assumedSize: Int, slicingArguments: [String], sizedFields: [String]) on FIELD_DEFINITION

    type Order {
      id: ID
      date: String
    }

    type Query {
      orders(first: Int, after: ID, last: Int, before: ID): [Order] @listSize(requireOneSlicingArgument: true)
    }
  `)
  const { queryDocument } = generateRandomQuery(schema, { seed: 1 })
  const query = print(queryDocument)
  expect(query.trim()).toEqual(
    dedent(`
      query RandomQuery {
        orders {
          id
          date
        }
      }
    `).trim()
  )
  expect(validate(schema, queryDocument)).toEqual([])
})

test(`Ignore non-existent slicing argument defined in @listSize`, () => {
  const schema = buildSchema(`
    directive @listSize(requireOneSlicingArgument: Boolean = true, assumedSize: Int, slicingArguments: [String], sizedFields: [String]) on FIELD_DEFINITION

    type Order {
      id: ID
      date: String
    }

    type Query {
      orders(first: Int, after: ID, last: Int, before: ID): [Order] @listSize(slicingArguments: ["other"])
    }
  `)
  const { queryDocument } = generateRandomQuery(schema, { seed: 1 })
  const query = print(queryDocument)
  expect(query.trim()).toEqual(
    dedent(`
      query RandomQuery {
        orders {
          id
          date
        }
      }
    `).trim()
  )
  expect(validate(schema, queryDocument)).toEqual([])
})

test(`Ignore slicing argument if requireOneSlicingArgument is set to false`, () => {
  const schema = buildSchema(`
    directive @listSize(requireOneSlicingArgument: Boolean = true, assumedSize: Int, slicingArguments: [String], sizedFields: [String]) on FIELD_DEFINITION

    type Order {
      id: ID
      date: String
    }

    type Query {
      orders(first: Int, after: ID, last: Int, before: ID): [Order] @listSize(slicingArguments: ["first"], requireOneSlicingArgument: false)
    }
  `)
  const { queryDocument } = generateRandomQuery(schema, { seed: 1 })
  const query = print(queryDocument)
  expect(query.trim()).toEqual(
    dedent(`
      query RandomQuery {
        orders {
          id
          date
        }
      }
    `).trim()
  )
  expect(validate(schema, queryDocument)).toEqual([])
})

test(`Add nested slicing argument ("args.first") when defined in @listSize`, () => {
  const schema = buildSchema(`
    directive @listSize(requireOneSlicingArgument: Boolean = true, assumedSize: Int, slicingArguments: [String], sizedFields: [String]) on FIELD_DEFINITION

    input Args {
      first: Int
      after: ID
      last: Int
      before: ID
    }

    type Order {
      id: ID
      date: String
    }

    type Query {
      orders(args: Args): [Order] @listSize(slicingArguments: ["args.first", "args.last"])
    }
  `)
  const config = {
    providePlaceholders: true,
    seed: 1
  }
  const { queryDocument, variableValues } = generateRandomQuery(schema, config)
  const query = print(queryDocument)
  expect(query.trim()).toEqual(
    dedent(`
      query RandomQuery($Query__orders__args: Args) {
        orders(args: $Query__orders__args) {
          id
          date
        }
      }
    `).trim()
  )
  const variables = JSON.stringify(variableValues, null, 2)
  expect(variables.trim()).toEqual(
    dedent(`
      {
        "Query__orders__args": {
          "first": 10
        }
      }
    `).trim()
  )
  expect(validate(schema, queryDocument)).toEqual([])
})

test(`Add nested required argument ("args.first")`, () => {
  const schema = buildSchema(`
    directive @listSize(requireOneSlicingArgument: Boolean = true, assumedSize: Int, slicingArguments: [String], sizedFields: [String]) on FIELD_DEFINITION

    input Args {
      first: Int!
      after: ID
    }

    type Order {
      id: ID
      date: String
    }

    type Query {
      orders(args: Args!): [Order]
    }
  `)
  const config = {
    providePlaceholders: true,
    seed: 1
  }
  const { queryDocument, variableValues } = generateRandomQuery(schema, config)
  const query = print(queryDocument)
  expect(query.trim()).toEqual(
    dedent(`
      query RandomQuery($Query__orders__args: Args!) {
        orders(args: $Query__orders__args) {
          id
          date
        }
      }
    `).trim()
  )
  const variables = JSON.stringify(variableValues, null, 2)
  expect(variables.trim()).toEqual(
    dedent(`
      {
        "Query__orders__args": {
          "first": 10
        }
      }
    `).trim()
  )
  expect(validate(schema, queryDocument)).toEqual([])
})

test(`Add nested slicing argument ("args.first" and "args.complex.last") when defined in @listSize`, () => {
  const schema = buildSchema(`
    directive @listSize(requireOneSlicingArgument: Boolean = true, assumedSize: Int, slicingArguments: [String], sizedFields: [String]) on FIELD_DEFINITION
    
    input MoreArgs {
      last: Int!
      before: ID
    }

    input Args {
      first: Int!
      after: ID
      complex: MoreArgs!
    }

    type Order {
      id: ID
      date: String
    }

    type Query {
      orders(args: Args!): [Order]
    }
  `)
  const config = {
    providePlaceholders: true,
    seed: 1
  }
  const { queryDocument, variableValues } = generateRandomQuery(schema, config)
  const query = print(queryDocument)
  expect(query.trim()).toEqual(
    dedent(`
      query RandomQuery($Query__orders__args: Args!) {
        orders(args: $Query__orders__args) {
          id
          date
        }
      }
    `).trim()
  )
  const variables = JSON.stringify(variableValues, null, 2)
  expect(variables.trim()).toEqual(
    dedent(`
      {
        "Query__orders__args": {
          "first": 10,
          "complex": {
            "last": 10
          }
        }
      }
    `).trim()
  )
  expect(validate(schema, queryDocument)).toEqual([])
})
