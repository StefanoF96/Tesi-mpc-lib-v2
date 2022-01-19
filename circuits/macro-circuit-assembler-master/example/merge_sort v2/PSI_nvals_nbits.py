# -*- coding: utf-8 -*-
"""
Created on Wed Jan 19 18:49:32 2022

@author: Stefa
"""

import math

def isPowerOfTwo(n):
    return (math.ceil(math.log(n,2)) == math.floor(math.log(n,2)));


def create_main_circuit(n_inputs, n_bits):
    if (not isPowerOfTwo(n_inputs)):
        raise ValueError('inputs number needs to be a power of 2')
        return
    #1 creating main file
    file_name = 'PSI_'+str(n_inputs)+'+'+str(n_inputs)+'input_32bits.casm'
    f = open(file_name, 'w')
    
    n_wires_per_party = int((math.log(n_inputs*2,2)+n_bits)*n_inputs)
    print(str(n_wires_per_party))
    n_output_wires = int(n_bits*(n_inputs*2-1))
    print(str(n_output_wires))
    
    n_gates_tot = int(n_inputs*4-1)
    print(n_gates_tot)
    n_wires_tot = int(n_wires_per_party*4+n_output_wires+(n_inputs*2-1))
    print(n_wires_tot)
    
    f.write(str(n_gates_tot) + ' ' +str(n_wires_tot))
    f.write('\n')
    f.write('2 '+str(n_wires_per_party)+' '+str(n_wires_per_party))
    f.write('\n')
    f.write('1 '+str(n_output_wires))
    f.write('\n')
    f.write(str(n_wires_per_party*2)+' '+str(n_wires_per_party*2)+' [0:'+str(n_wires_per_party*4-1)+'] ./sorter_'+str(n_inputs)+'+'+str(n_inputs)+'input_32bits_for_PSI.casm')
    f.write('\n')
    
    intermedial_wire_index = n_wires_per_party*4
    for i in range(n_inputs*2-1):
        f.write(str(n_bits*2)+' 1 ['+str(n_wires_per_party*2+n_bits*i)+':'+str(n_wires_per_party*2+n_bits*i+n_bits*2-1)+'] '+str(intermedial_wire_index+i)+' ./'+str(n_bits)+'bit_equality.casm')
        f.write('\n')
    
    
    '''
64 1 [136:199] 272 ./32bit_equality.casm
64 1 [168:231] 273 ./32bit_equality.casm
64 1 [200:263] 274 ./32bit_equality.casm
33 32 [136:167] 272 [275:306] ./32bit_mult_1bit.txt
33 32 [168:199] 273 [307:338] ./32bit_mult_1bit.txt
33 32 [200:231] 274 [339:370] ./32bit_mult_1bit.txt
    
    '''
    intermedial_wire_index = n_wires_per_party*4
    out_wire_index = n_wires_per_party*4+n_inputs*2-1
    for i in range(n_inputs*2-1):
        f.write(str(n_bits+1)+' '+str(n_bits)+' ['+str(n_wires_per_party*2+n_bits*i)+':'+str(n_wires_per_party*2+n_bits*i+n_bits-1)+'] '+str(intermedial_wire_index+i)+' ['+str(out_wire_index+n_bits*i)+':'+str(out_wire_index+n_bits*i+n_bits-1)+'] ./'+str(n_bits)+'bit_mult_1bit.txt')
        f.write('\n')
    

    


    f.close()
    