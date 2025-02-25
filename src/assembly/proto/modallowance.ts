import { Writer, Reader } from "as-proto";

export namespace modallowance {
  @unmanaged
  export class Uint32 {
    static encode(message: Uint32, writer: Writer): void {
      if (message.value != 0) {
        writer.uint32(8);
        writer.uint32(message.value);
      }
    }

    static decode(reader: Reader, length: i32): Uint32 {
      const end: usize = length < 0 ? reader.end : reader.ptr + length;
      const message = new Uint32();

      while (reader.ptr < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          case 1:
            message.value = reader.uint32();
            break;

          default:
            reader.skipType(tag & 7);
            break;
        }
      }

      return message;
    }

    value: u32;

    constructor(value: u32 = 0) {
      this.value = value;
    }
  }

  export class allowances {
    static encode(message: allowances, writer: Writer): void {
      const unique_name_value = message.value;
      for (let i = 0; i < unique_name_value.length; ++i) {
        writer.uint32(10);
        writer.fork();
        allowance.encode(unique_name_value[i], writer);
        writer.ldelim();
      }
    }

    static decode(reader: Reader, length: i32): allowances {
      const end: usize = length < 0 ? reader.end : reader.ptr + length;
      const message = new allowances();

      while (reader.ptr < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          case 1:
            message.value.push(allowance.decode(reader, reader.uint32()));
            break;

          default:
            reader.skipType(tag & 7);
            break;
        }
      }

      return message;
    }

    value: Array<allowance>;

    constructor(value: Array<allowance> = []) {
      this.value = value;
    }
  }

  export class operation {
    static encode(message: operation, writer: Writer): void {
      const unique_name_contract_id = message.contract_id;
      if (unique_name_contract_id !== null) {
        writer.uint32(10);
        writer.bytes(unique_name_contract_id);
      }

      if (message.entry_point != 0) {
        writer.uint32(16);
        writer.uint32(message.entry_point);
      }

      const unique_name_args = message.args;
      if (unique_name_args !== null) {
        writer.uint32(26);
        writer.bytes(unique_name_args);
      }
    }

    static decode(reader: Reader, length: i32): operation {
      const end: usize = length < 0 ? reader.end : reader.ptr + length;
      const message = new operation();

      while (reader.ptr < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          case 1:
            message.contract_id = reader.bytes();
            break;

          case 2:
            message.entry_point = reader.uint32();
            break;

          case 3:
            message.args = reader.bytes();
            break;

          default:
            reader.skipType(tag & 7);
            break;
        }
      }

      return message;
    }

    contract_id: Uint8Array | null;
    entry_point: u32;
    args: Uint8Array | null;

    constructor(
      contract_id: Uint8Array | null = null,
      entry_point: u32 = 0,
      args: Uint8Array | null = null
    ) {
      this.contract_id = contract_id;
      this.entry_point = entry_point;
      this.args = args;
    }
  }

  export class allowance {
    static encode(message: allowance, writer: Writer): void {
      const unique_name_tx_id = message.tx_id;
      if (unique_name_tx_id !== null) {
        writer.uint32(10);
        writer.bytes(unique_name_tx_id);
      }

      const unique_name_caller = message.caller;
      if (unique_name_caller !== null) {
        writer.uint32(18);
        writer.bytes(unique_name_caller);
      }

      const unique_name_operation = message.operation;
      if (unique_name_operation !== null) {
        writer.uint32(26);
        writer.fork();
        operation.encode(unique_name_operation, writer);
        writer.ldelim();
      }
    }

    static decode(reader: Reader, length: i32): allowance {
      const end: usize = length < 0 ? reader.end : reader.ptr + length;
      const message = new allowance();

      while (reader.ptr < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          case 1:
            message.tx_id = reader.bytes();
            break;

          case 2:
            message.caller = reader.bytes();
            break;

          case 3:
            message.operation = operation.decode(reader, reader.uint32());
            break;

          default:
            reader.skipType(tag & 7);
            break;
        }
      }

      return message;
    }

    tx_id: Uint8Array | null;
    caller: Uint8Array | null;
    operation: operation | null;

    constructor(
      tx_id: Uint8Array | null = null,
      caller: Uint8Array | null = null,
      operation: operation | null = null
    ) {
      this.tx_id = tx_id;
      this.caller = caller;
      this.operation = operation;
    }
  }

  export class allow_args {
    static encode(message: allow_args, writer: Writer): void {
      const unique_name_user = message.user;
      if (unique_name_user !== null) {
        writer.uint32(10);
        writer.bytes(unique_name_user);
      }

      const unique_name_operation = message.operation;
      if (unique_name_operation !== null) {
        writer.uint32(18);
        writer.fork();
        operation.encode(unique_name_operation, writer);
        writer.ldelim();
      }
    }

    static decode(reader: Reader, length: i32): allow_args {
      const end: usize = length < 0 ? reader.end : reader.ptr + length;
      const message = new allow_args();

      while (reader.ptr < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          case 1:
            message.user = reader.bytes();
            break;

          case 2:
            message.operation = operation.decode(reader, reader.uint32());
            break;

          default:
            reader.skipType(tag & 7);
            break;
        }
      }

      return message;
    }

    user: Uint8Array | null;
    operation: operation | null;

    constructor(
      user: Uint8Array | null = null,
      operation: operation | null = null
    ) {
      this.user = user;
      this.operation = operation;
    }
  }

  export class get_allowances_args {
    static encode(message: get_allowances_args, writer: Writer): void {
      const unique_name_user = message.user;
      if (unique_name_user !== null) {
        writer.uint32(10);
        writer.bytes(unique_name_user);
      }
    }

    static decode(reader: Reader, length: i32): get_allowances_args {
      const end: usize = length < 0 ? reader.end : reader.ptr + length;
      const message = new get_allowances_args();

      while (reader.ptr < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          case 1:
            message.user = reader.bytes();
            break;

          default:
            reader.skipType(tag & 7);
            break;
        }
      }

      return message;
    }

    user: Uint8Array | null;

    constructor(user: Uint8Array | null = null) {
      this.user = user;
    }
  }

  export class get_allowances_result {
    static encode(message: get_allowances_result, writer: Writer): void {
      const unique_name_value = message.value;
      for (let i = 0; i < unique_name_value.length; ++i) {
        writer.uint32(10);
        writer.fork();
        allowance.encode(unique_name_value[i], writer);
        writer.ldelim();
      }
    }

    static decode(reader: Reader, length: i32): get_allowances_result {
      const end: usize = length < 0 ? reader.end : reader.ptr + length;
      const message = new get_allowances_result();

      while (reader.ptr < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          case 1:
            message.value.push(allowance.decode(reader, reader.uint32()));
            break;

          default:
            reader.skipType(tag & 7);
            break;
        }
      }

      return message;
    }

    value: Array<allowance>;

    constructor(value: Array<allowance> = []) {
      this.value = value;
    }
  }
}
