import { System, Storage, authority, Arrays } from "@koinos/sdk-as";
import { modvalidation, ModValidation, MODULE_VALIDATION_TYPE_ID } from "@veive-io/mod-validation-as";
import { modallowance } from "./proto/modallowance";

export class ModAllowance extends ModValidation {
  callArgs: System.getArgumentsReturn | null;

  contract_id: Uint8Array = System.getContractId();
  
  allowance_storage: Storage.Map<Uint8Array,modallowance.allowances> = new Storage.Map(
    this.contract_id,
    0,
    modallowance.allowances.decode,
    modallowance.allowances.encode,
    () => new modallowance.allowances()
  );

  /**
   * Validate operation by checking allowance
   * @external
   */
  is_authorized(args: modvalidation.authorize_arguments): modvalidation.authorize_result {
    // check if operation is "allow" of this contract
    if (
      Arrays.equal(args.call!.contract_id!, this.contract_id) == true &&
      args.call!.entry_point == 1090552691
    ) {
      System.log(`[mod-allowance] skip allow`);
      return new modvalidation.authorize_result(true);
    }

    System.log(`[mod-allowance] checking ${args.call!.entry_point.toString()}`);

    const caller = System.getCaller().caller;

    const allowances_storage = this.allowance_storage.get(caller);
    if (allowances_storage && allowances_storage.value.length > 0) {

      for (let i = 0; i < allowances_storage.value.length; i++) {
        const allowance = allowances_storage.value[i];

        if (
          Arrays.equal(allowance.tx_id, System.getTransactionField("id")!.bytes_value) == true &&
          Arrays.equal(allowance.operation!.contract_id, args.call!.contract_id!) == true &&
          allowance.operation!.entry_point == args.call!.entry_point == true &&
          Arrays.equal(allowance.operation!.args, args.call!.data!) == true
        ) {
          System.log(`[mod-allowance] allowing ${args.call!.entry_point.toString()}`);
          this._remove_allowance(caller, i);
          return new modvalidation.authorize_result(true);
        }
      }

    }

    System.log(`[mod-allowance] fail ${args.call!.entry_point.toString()}`);

    return new modvalidation.authorize_result(false);
  }

  /**
   * Save operation to allow
   * @external
   */
  allow(args: modallowance.allow_args): void {
    const is_authorized = System.checkAuthority(authority.authorization_type.contract_call, args.user!);
    System.require(is_authorized, `not authorized by the account`);

    const allowances_storage = this.allowance_storage.get(args.user!) || new modallowance.allowances([]);

    const allowance = new modallowance.allowance();
    allowance.tx_id = System.getTransactionField("id")!.bytes_value;
    allowance.operation = args.operation!
    allowance.caller = args.user!;

    allowances_storage.value.push(allowance);
    this.allowance_storage.put(args.user!, allowances_storage);

    System.log(`[mod-allowance] pre-allow ${args.operation!.entry_point}`);
  }

  /**
   * @external
   * @readonly
   */
  get_allowances(args: modallowance.get_allowances_args): modallowance.get_allowances_result {
    return new modallowance.get_allowances_result(this.allowance_storage.get(args.user!)!.value);
  }

  /**
   * @external
   */
  on_install(args: modvalidation.on_install_args): void {
    System.log('[mod-allowance] called on_install');
  }

  /**
   * @external
   * @readonly
   */
  manifest(): modvalidation.manifest {
    const result = new modvalidation.manifest();
    result.name = "Allowance";
    result.description = "Pre-authorize each operation in order to execute it";
    result.type_id = MODULE_VALIDATION_TYPE_ID;
    result.scopes = [
      new modvalidation.scope('contract_call')
    ];
    result.version = "2.0.0";
    return result;
  }
  /**
   * remove allowance by index
   */
  _remove_allowance(user: Uint8Array, index: u32): void {
    const new_allowances = new modallowance.allowances([]);

    const allowances_storage = this.allowance_storage.get(user)!;
    for (let i = 0; i < allowances_storage.value.length; i++) {
      if (i != index) {
        new_allowances.value.push(allowances_storage.value[i]);
      }
    }

    this.allowance_storage.put(user, new_allowances);
  }
}
