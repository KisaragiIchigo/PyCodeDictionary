import { SupportedLanguage } from '../../types';

// Tree-sitter S-expression クエリ定義 (各言語公式文法準拠)
export const TREE_SITTER_QUERIES: Partial<Record<SupportedLanguage, string>> = {
  python: `
    (function_definition
      name: (identifier) @func.name
      parameters: (parameters)? @func.params
      return_type: (type)? @func.returnType
    ) @func.def

    (class_definition
      name: (identifier) @class.name
      superclasses: (argument_list)? @class.bases
    ) @class.def

    (call
      function: [
        (identifier) @call.name
        (attribute attribute: (identifier) @call.name)
      ]
    ) @call.expr

    (import_statement) @import.stmt
    (import_from_statement) @import.stmt
  `,

  typescript: `
    (function_declaration
      name: (identifier) @func.name
      parameters: (formal_parameters)? @func.params
      return_type: (type_annotation)? @func.returnType
    ) @func.def

    (method_definition
      name: [
        (property_identifier) @func.name
        (identifier) @func.name
      ]
      parameters: (formal_parameters)? @func.params
      return_type: (type_annotation)? @func.returnType
    ) @func.def

    (arrow_function
      parameters: (formal_parameters)? @func.params
      return_type: (type_annotation)? @func.returnType
    ) @func.arrow

    (class_declaration
      name: (type_identifier) @class.name
      heritage: (class_heritage)? @class.bases
    ) @class.def

    (interface_declaration
      name: (type_identifier) @interface.name
    ) @interface.def

    (call_expression
      function: [
        (identifier) @call.name
        (member_expression property: (property_identifier) @call.name)
      ]
    ) @call.expr

    (import_statement) @import.stmt
  `,

  javascript: `
    (function_declaration
      name: (identifier) @func.name
      parameters: (formal_parameters)? @func.params
    ) @func.def

    (method_definition
      name: [
        (property_identifier) @func.name
        (identifier) @func.name
      ]
      parameters: (formal_parameters)? @func.params
    ) @func.def

    (arrow_function
      parameters: (formal_parameters)? @func.params
    ) @func.arrow

    (class_declaration
      name: (identifier) @class.name
    ) @class.def

    (call_expression
      function: [
        (identifier) @call.name
        (member_expression property: (property_identifier) @call.name)
      ]
    ) @call.expr

    (import_statement) @import.stmt
  `,

  rust: `
    (function_item
      name: (identifier) @func.name
      parameters: (parameters)? @func.params
      return_type: (type_identifier)? @func.returnType
    ) @func.def

    (struct_item
      name: (type_identifier) @struct.name
    ) @struct.def

    (enum_item
      name: (type_identifier) @enum.name
    ) @enum.def

    (trait_item
      name: (type_identifier) @trait.name
    ) @trait.def

    (impl_item
      trait: (type_identifier)? @impl.trait
      type: (type_identifier) @impl.target
    ) @impl.def

    (call_expression
      function: [
        (identifier) @call.name
        (field_expression field: (field_identifier) @call.name)
        (scoped_identifier name: (identifier) @call.name)
      ]
    ) @call.expr

    (use_declaration) @import.stmt
  `,

  go: `
    (function_declaration
      name: (identifier) @func.name
      parameters: (parameter_list)? @func.params
      result: [
        (type_identifier) @func.returnType
        (parameter_list) @func.returnType
      ]?
    ) @func.def

    (method_declaration
      receiver: (parameter_list) @method.receiver
      name: (field_identifier) @func.name
      parameters: (parameter_list)? @func.params
      result: [
        (type_identifier) @func.returnType
        (parameter_list) @func.returnType
      ]?
    ) @func.def

    (type_declaration
      (type_spec
        name: (type_identifier) @type.name
        type: [
          (struct_type) @struct.def
          (interface_type) @interface.def
        ]
      )
    ) @type.def

    (call_expression
      function: [
        (identifier) @call.name
        (selector_expression field: (field_identifier) @call.name)
      ]
    ) @call.expr

    (import_declaration) @import.stmt
  `,

  cpp: `
    (function_definition
      declarator: (function_declarator
        declarator: [
          (identifier) @func.name
          (field_identifier) @func.name
          (scoped_identifier name: (identifier) @func.name)
        ]
        parameters: (parameter_list)? @func.params
      )
      type: (type_identifier)? @func.returnType
    ) @func.def

    (class_specifier
      name: (type_identifier) @class.name
      base_class_clause: (base_class_clause)? @class.bases
    ) @class.def

    (struct_specifier
      name: (type_identifier) @struct.name
    ) @struct.def

    (call_expression
      function: [
        (identifier) @call.name
        (field_expression field: (field_identifier) @call.name)
        (scoped_identifier name: (identifier) @call.name)
      ]
    ) @call.expr

    (preproc_include) @import.stmt
  `,

  shell: `
    (function_definition
      name: (word) @func.name
    ) @func.def

    (command
      name: (command_name) @call.name
    ) @call.expr
  `
};
