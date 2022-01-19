import math

def isPowerOfTwo(n):
    return (math.ceil(math.log(n,2)) == math.floor(math.log(n,2)));

#n_inputs per party
def create_main_circuit(n_inputs, n_bits):
    if (not isPowerOfTwo(n_inputs)):
        raise ValueError('inputs number needs to be a power of 2')
        return
    #1 creating main file
    file_name = 'sorter_'+str(n_inputs)+'+'+str(n_inputs)+'input_'+str(n_bits)+'bits.casm'
    f = open(file_name, 'w')
    n_wires_per_party = int(n_inputs*n_bits+math.log(n_inputs*2,2)*n_inputs)
    n_wires_tot = int(n_wires_per_party*6)
    f.write('3 '+str(n_wires_tot))
    f.write('\n')
    f.write('2 '+str(n_wires_per_party)+' '+str(n_wires_per_party))
    f.write('\n')
    f.write('1 '+str(int(math.log(n_inputs*2,2))*n_inputs*2))
    f.write('\n')
    f.write(str(n_wires_per_party)+' '+str(n_wires_per_party)+' [0:'+str(n_wires_per_party-1)+'] ['+(str(n_wires_per_party*2))+':'+(str(n_wires_per_party*3-1))+'] ./odd_evenMergeSort'+str(n_inputs)+'val_'+str(n_bits)+'bit.casm')
    f.write('\n')
    f.write(str(n_wires_per_party)+' '+str(n_wires_per_party)+' ['+str(n_wires_per_party)+':'+str(n_wires_per_party*2-1)+'] ['+(str(n_wires_per_party*3))+':'+(str(n_wires_per_party*4-1))+'] ./odd_evenMergeSort'+str(n_inputs)+'val_'+str(n_bits)+'bit.casm')
    f.write('\n')
    f.write(str(n_wires_per_party*2)+' '+str(n_wires_per_party*2)+' ['+str(n_wires_per_party*2)+':'+str(n_wires_per_party*2+(n_inputs*n_bits)-1)+'] ['+str(n_wires_per_party*3)+':'+str(n_wires_per_party*3+(n_inputs*n_bits)-1)+'] ['+ str(n_wires_per_party*2+(n_inputs*n_bits)) +':'+str(n_wires_per_party*3-1)+'] ['+str(n_wires_per_party*3+(n_inputs*n_bits))+':'+str(n_wires_per_party*4-1)+'] ['+str(n_wires_per_party*4)+':'+str(n_wires_tot-1)+'] ./odd_evenMerge'+str(n_inputs*2)+'val_'+str(n_bits)+'bit.casm')
    f.close()
    #creating sub-files
    create_odd_evenMergeSort(n_inputs, n_bits, n_inputs*2)
    create_odd_evenMerge(n_inputs*2, n_bits, n_inputs*2)
    
    
def create_odd_evenMergeSort(n_inputs, n_bits, initial_inputs):
    if (not isPowerOfTwo(n_inputs)):
        raise ValueError('inputs number needs to be a power of 2')
    if(n_inputs<2):
        return
    pos_bits = math.log(initial_inputs,2)
    in_bits = int(n_inputs*(n_bits+pos_bits))
    out_bits = int(n_inputs*(n_bits+pos_bits))
    
    if (n_inputs == 2):
        n_gates =  1 
        n_wires = in_bits + out_bits
    elif (n_inputs > 2):
        n_gates = 3
        n_wires = in_bits*2 + out_bits
    
    
    #1 creating file odd_evenMergeSort
    file_name = 'odd_evenMergeSort'+str(n_inputs)+'val_'+str(n_bits)+'bit.casm'
   
    f = open(file_name, 'w')

    f.write(str(n_gates)+' '+str(n_wires))
    f.write('\n')
    f.write('1 '+str(in_bits))
    f.write('\n')
    f.write('1 '+str(out_bits))
    f.write('\n')
    if (n_inputs > 2):
        f.write(str(in_bits//2)+' '+str(in_bits//2)+' [0:'+str(n_inputs*n_bits//2-1)+'] ['+str(n_inputs*n_bits)+':'+str(int(n_inputs*n_bits+(n_inputs//2)*pos_bits)-1)+'] ['+str(in_bits)+':'+str(int(in_bits*3/2)-1)+'] ./odd_evenMergeSort'+str(n_inputs//2)+'val_'+str(n_bits)+'bit.casm')
        f.write('\n')
        f.write(str(in_bits//2)+' '+str(in_bits//2)+' ['+str(n_inputs*n_bits//2)+':'+str(n_inputs*n_bits-1)+'] ['+str(int(n_inputs*n_bits+(n_inputs//2)*pos_bits))+':'+str(int(n_inputs*n_bits+n_inputs*pos_bits)-1)+'] ['+str(int(in_bits*3/2))+':'+str(int(in_bits*2)-1)+'] ./odd_evenMergeSort'+str(n_inputs//2)+'val_'+str(n_bits)+'bit.casm')
        f.write('\n')
        f.write(str(in_bits)+' '+str(out_bits)+' ['+str(in_bits)+':'+str(in_bits+n_inputs*n_bits//2-1)+'] ['+str(int(in_bits*3/2))+':'+str(int(in_bits*3/2)+n_inputs*n_bits//2-1)+'] ['+str(in_bits+n_inputs*n_bits//2)+':'+str(int(in_bits*3/2)-1)+'] ['+str(int(in_bits*3/2)+n_inputs*n_bits//2)+':'+str(n_wires-1)+'] ./odd_evenMerge'+str(n_inputs)+'val_'+str(n_bits)+'bit.casm')
    else:
        f.write(str(in_bits)+' '+str(out_bits)+' [0:'+str(in_bits-1)+'] ['+str(in_bits)+':'+str(n_wires-1)+'] ./odd_evenMerge'+str(n_inputs)+'val_'+str(n_bits)+'bit.casm')

    f.close()
    #creating sub-files
    if(n_inputs>=2):
        create_odd_evenMergeSort(n_inputs//2, n_bits, initial_inputs)
        create_odd_evenMerge(n_inputs, n_bits, initial_inputs)
    


def create_odd_evenMerge(n_inputs, n_bits, initial_inputs):
    if ((not isPowerOfTwo(n_inputs)) or (not isPowerOfTwo(initial_inputs))):
        raise ValueError('inputs number needs to be a power of 2')
    if(n_inputs<2):
        return
    pos_bits = int(math.log(initial_inputs,2))
    in_bits = int(n_inputs*(n_bits+pos_bits))
    out_bits = int(n_inputs*(n_bits+pos_bits))
    
    if (n_inputs == 2):
        n_gates =  1 
        n_wires = in_bits + out_bits
    elif (n_inputs > 2):
        n_gates = 2+(n_inputs-2)//2
        n_wires = in_bits*3 - (n_bits+pos_bits)*2
        
    even_merge_line = str(in_bits//2)+" "+str(in_bits//2)+" "
    odd_merge_line = str(in_bits//2)+" "+str(in_bits//2)+" "
    
    
    #loops first 2 gates --- INPUTS
    for i in range(n_inputs):
        if i%2 == 0:
            even_merge_line += '['+str(i*n_bits)+':'+str(i*n_bits+n_bits-1)+'] '
        else:
            odd_merge_line += '['+str(i*n_bits)+':'+str(i*n_bits+n_bits-1)+'] '
    
    for i in range(n_inputs):
        if i%2 == 0:
            even_merge_line += '['+str(int(n_inputs*n_bits+i*pos_bits))+':'+str(int(n_inputs*n_bits+i*pos_bits+pos_bits-1))+'] '
        else:
            odd_merge_line += '['+str(int(n_inputs*n_bits+i*pos_bits))+':'+str(int(n_inputs*n_bits+i*pos_bits+pos_bits-1))+'] '
            
            
    #loops first 2 gates --- OUTPUTS        
    first_output =int(in_bits+(n_gates-2)*(n_bits+pos_bits)*2)
    even_merge_line += '['+str(first_output)+':'+str(first_output+n_bits-1)+'] '           
    for y in range(1,n_inputs-1):
        i = y-1
        if y%2 == 0:
            even_merge_line += '['+str(in_bits+i*n_bits)+':'+str(in_bits+i*n_bits+n_bits-1)+'] '
        else:
            odd_merge_line += '['+str(in_bits+i*n_bits)+':'+str(in_bits+i*n_bits+n_bits-1)+'] '
    odd_merge_line += '['+str(first_output+2*n_bits*(n_gates-2)+n_bits)+':'+str(first_output+2*n_bits*(n_gates-2)+2*n_bits-1)+'] ' 
    
    first_output_pos = int(first_output+2*n_bits*(n_gates-2)+2*n_bits)
    even_merge_line += '['+str(first_output_pos)+':'+str(int(first_output_pos+pos_bits)-1)+'] '           
    for y in range(1,n_inputs-1):
        i = y-1
        if y%2 == 0:
            even_merge_line += '['+str((n_inputs-2)*n_bits+in_bits+i*pos_bits)+':'+str((n_inputs-2)*n_bits+in_bits+i*pos_bits+pos_bits-1)+'] '
        else:
            odd_merge_line += '['+str((n_inputs-2)*n_bits+in_bits+i*pos_bits)+':'+str((n_inputs-2)*n_bits+in_bits+i*pos_bits+pos_bits-1)+'] '
    odd_merge_line += '['+str(int(first_output_pos+pos_bits+pos_bits*(n_gates-2)*2))+':'+str(int(first_output_pos+pos_bits+pos_bits*(n_gates-2)*2)+pos_bits-1)+'] '
    

    #adding call to lower ./odd_evenMerge
    even_merge_line += './odd_evenMerge'+str(n_inputs//2)+'val_'+str(n_bits)+'bit.casm'
    odd_merge_line += './odd_evenMerge'+str(n_inputs//2)+'val_'+str(n_bits)+'bit.casm'
    
    print(even_merge_line)
    print(odd_merge_line)

    
    # creating file odd_evenMerge
    file_name = 'odd_evenMerge'+str(n_inputs)+'val_'+str(n_bits)+'bit.casm'
    f = open(file_name, 'w')
    
    
    f.write(str(n_gates)+' '+str(n_wires))
    f.write('\n')
    f.write('1 '+str(in_bits))
    f.write('\n')
    f.write('1 '+str(out_bits))
    
    
    if (n_inputs > 2):
        f.write('\n')
        f.write(even_merge_line)
        f.write('\n')
        f.write(odd_merge_line)
        
        first_in_val = in_bits
        first_in_pos = first_in_val+n_bits*2*(n_gates-2)
        first_out_val = first_output+n_bits
        first_out_pos = first_output_pos+pos_bits
        comp_exchange_in = (n_bits+pos_bits)*2
        for i in range(n_gates-2):
            last_in_val = first_in_val+n_bits*2-1
            last_in_pos = first_in_pos+pos_bits*2-1
            last_out_val = first_out_val+n_bits*2-1
            last_out_pos = first_out_pos+pos_bits*2-1
            
            f.write('\n')
            f.write(str(comp_exchange_in)+' '+str(comp_exchange_in)+ ' ['+str(first_in_val)+':'+str(last_in_val)+'] ['+str(first_in_pos)+':'+str(last_in_pos)+'] ['+str(first_out_val)+':'+str(last_out_val)+'] ['+str(first_out_pos)+':'+str(last_out_pos)+'] ./compare_exchange_'+str(n_bits)+'bit.casm')
            
            first_in_val = last_in_val+1
            first_in_pos = last_in_pos+1
            first_out_val = last_out_val+1
            first_out_pos = last_out_pos+1
    else:
        #only 2 inputs
        f.write('\n')
        f.write(str(in_bits)+' '+str(out_bits)+' [0:'+str(in_bits-1)+'] ['+str(in_bits)+':'+str(n_wires-1)+'] ./compare_exchange_'+str(n_bits)+'bit.casm')

    
    f.close()
    #creating sub-files
    if(n_inputs>=2):
        create_odd_evenMerge(n_inputs//2, n_bits, initial_inputs)
        compare_exchange(n_bits, initial_inputs)
    
    
def compare_exchange(n_bits, initial_inputs):
    if (not isPowerOfTwo(initial_inputs)):
        raise ValueError('inputs number needs to be a power of 2')
    pos_bits = int(math.log(initial_inputs,2))
    in_bits = int(2*(n_bits+pos_bits))
    out_bits = int(2*(n_bits+pos_bits))
    
    n_gates = 14
    n_wires = n_bits*2 + 2 + n_bits*2 + n_bits + n_bits*2 + n_bits + pos_bits*4 + pos_bits + pos_bits*2 +pos_bits
    
    print(n_gates)
    print(n_wires)

    # creating file compare_exchange
    file_name = 'compare_exchange_'+str(n_bits)+'bit.casm'
    f = open(file_name, 'w')
    
    f.write(str(n_gates)+' '+str(n_wires))
    f.write('\n')
    f.write('1 '+str(in_bits))
    f.write('\n')
    f.write('1 '+str(out_bits))
    f.write('\n')
    
    final_out_1_start = n_wires-out_bits 
    final_out_2_start = final_out_1_start+n_bits
    final_out_3_start = final_out_2_start+n_bits
    final_out_4_start = final_out_3_start+pos_bits
    
    #write gates for vals
    f.write(str(n_bits*2)+' 1 [0:'+str(n_bits*2-1)+'] '+str(in_bits)+' ./greater_than_'+str(n_bits)+'bit.casm\n') #line defining a greater
    f.write('1 1 '+str(in_bits)+' '+str(in_bits+1)+' INV\n') #line defining b greater (or equal))
    out_val_start_1 = in_bits+2
    out_val_start_2 = out_val_start_1+n_bits
    f.write(str(n_bits+1)+' '+str(n_bits)+' [0:'+str(n_bits-1)+'] '+str(in_bits)+' ['+str(out_val_start_1)+':'+str(out_val_start_1+n_bits-1)+'] ./'+str(n_bits)+'bit_mult_1bit.txt\n')
    f.write(str(n_bits+1)+' '+str(n_bits)+' ['+str(n_bits)+':'+str(n_bits*2-1)+'] '+str(in_bits+1)+' ['+str(out_val_start_2)+':'+str(out_val_start_2+n_bits-1)+'] ./'+str(n_bits)+'bit_mult_1bit.txt\n')
    f.write(str(n_bits*2)+' '+str(n_bits)+' ['+str(out_val_start_1)+':'+str(out_val_start_2+n_bits-1)+'] ['+str(final_out_2_start)+':'+str(final_out_2_start+n_bits-1)+'] ./'+str(n_bits)+'bit_adder_with_a_0.casm\n')
    out_val_start_3 = out_val_start_2+n_bits
    out_val_start_4 = out_val_start_3+n_bits    
    f.write(str(n_bits+1)+' '+str(n_bits)+' [0:'+str(n_bits-1)+'] '+str(in_bits+1)+' ['+str(out_val_start_3)+':'+str(out_val_start_3+n_bits-1)+'] ./'+str(n_bits)+'bit_mult_1bit.txt\n')
    f.write(str(n_bits+1)+' '+str(n_bits)+' ['+str(n_bits)+':'+str(n_bits*2-1)+'] '+str(in_bits)+' ['+str(out_val_start_4)+':'+str(out_val_start_4+n_bits-1)+'] ./'+str(n_bits)+'bit_mult_1bit.txt\n')
    f.write(str(n_bits*2)+' '+str(n_bits)+' ['+str(out_val_start_3)+':'+str(out_val_start_4+n_bits-1)+'] ['+str(final_out_1_start)+':'+str(final_out_1_start+n_bits-1)+'] ./'+str(n_bits)+'bit_adder_with_a_0.casm\n')
    
    #now write gates for pos
    out_pos_start_1 = out_val_start_4+n_bits
    out_pos_start_2 = out_pos_start_1+pos_bits
    f.write(str(pos_bits+1)+' '+str(pos_bits)+' ['+str(n_bits*2)+':'+str(n_bits*2+pos_bits-1)+'] '+str(in_bits)+' ['+str(out_pos_start_1)+':'+str(out_pos_start_1+pos_bits-1)+'] ./'+str(pos_bits)+'bit_mult_1bit.txt\n')
    f.write(str(pos_bits+1)+' '+str(pos_bits)+' ['+str(n_bits*2+pos_bits)+':'+str(n_bits*2+pos_bits*2-1)+'] '+str(in_bits+1)+' ['+str(out_pos_start_2)+':'+str(out_pos_start_2+pos_bits-1)+'] ./'+str(pos_bits)+'bit_mult_1bit.txt\n')
    f.write(str(pos_bits*2)+' '+str(pos_bits)+' ['+str(out_pos_start_1)+':'+str(out_pos_start_2+pos_bits-1)+'] ['+str(final_out_4_start)+':'+str(final_out_4_start+pos_bits-1)+'] ./'+str(pos_bits)+'bit_adder_with_a_0.casm\n')
    out_pos_start_3 = out_pos_start_2+pos_bits
    out_pos_start_4 = out_pos_start_3+pos_bits
    f.write(str(pos_bits+1)+' '+str(pos_bits)+' ['+str(n_bits*2)+':'+str(n_bits*2+pos_bits-1)+'] '+str(in_bits+1)+' ['+str(out_pos_start_3)+':'+str(out_pos_start_3+pos_bits-1)+'] ./'+str(pos_bits)+'bit_mult_1bit.txt\n')
    f.write(str(pos_bits+1)+' '+str(pos_bits)+' ['+str(n_bits*2+pos_bits)+':'+str(n_bits*2+pos_bits*2-1)+'] '+str(in_bits)+' ['+str(out_pos_start_4)+':'+str(out_pos_start_4+pos_bits-1)+'] ./'+str(pos_bits)+'bit_mult_1bit.txt\n')
    f.write(str(pos_bits*2)+' '+str(pos_bits)+' ['+str(out_pos_start_3)+':'+str(out_pos_start_4+pos_bits-1)+'] ['+str(final_out_3_start)+':'+str(final_out_3_start+pos_bits-1)+'] ./'+str(pos_bits)+'bit_adder_with_a_0.casm\n')
    
    f.close()
    #generate sub-files
    greater_than(n_bits)
    mult_1_bit(n_bits)
    adder_with_a_0(n_bits)
    mult_1_bit(pos_bits)
    adder_with_a_0(pos_bits)
    
    
    
def greater_than(n_bits):
    
    if (n_bits%4 != 0):
        raise ValueError('bits number have to be a multiple of 4')
    
    n_gates = 3+n_bits//4
    n_wires = n_bits*2+3+(n_gates-3)*3
    
    # creating file greater_than
    file_name = './greater_than_'+str(n_bits)+'bit.casm'
    f = open(file_name, 'w')
    
    f.write(str(n_gates)+' '+str(n_wires))
    f.write('\n')
    f.write('2 '+str(n_bits)+' '+str(n_bits))
    f.write('\n')
    f.write('1 1')
    f.write('\n')
    f.write('2 1 0 0 '+str(n_bits*2)+' ./costant0.txt')
    f.write('\n')
    f.write('1 1 '+str(n_bits*2)+' '+str(n_bits*2+1)+' INV')
    f.write('\n')
    f.write('2 1 0 0 '+str(n_bits*2+2)+' ./costant0.txt')
    f.write('\n')
    for i in range((n_bits//4)-1):
        f.write('11 3 ['+str(i*4)+':'+str(i*4+3)+'] ['+str(n_bits+i*4)+':'+str(n_bits+i*4+3)+'] ['+str(2*n_bits+i*3)+':'+str(2*n_bits+i*3+2)+'] ['+str(2*n_bits+i*3+3)+':'+str(2*n_bits+i*3+5)+'] ./4bit_comparator(cascade).txt')
        f.write('\n')
    i+=1
    f.write('11 3 ['+str(i*4)+':'+str(i*4+3)+'] ['+str(n_bits+i*4)+':'+str(n_bits+i*4+3)+'] ['+str(2*n_bits+i*3)+':'+str(2*n_bits+i*3+2)+'] '+str(2*n_bits+i*3+5)+' '+str(2*n_bits+i*3+3)+' '+str(2*n_bits+i*3+4)+' ./4bit_comparator(cascade).txt')
    
    f.close()
    
    
def mult_1_bit(n_bits):
    
    n_gates = n_bits
    n_wires = n_bits*2+1

    # creating file mult_1_bit
    file_name = './'+str(n_bits)+'bit_mult_1bit.txt'
    f = open(file_name, 'w')
    
    f.write(str(n_gates)+' '+str(n_wires))
    f.write('\n')
    f.write('2 '+str(n_bits)+' 1')
    f.write('\n')
    f.write('1 '+str(n_bits))
    for i in range(n_bits):
        f.write('\n')
        f.write('2 1 '+str(i)+' '+str(n_bits)+' '+str(n_bits+i+1)+' AND')
         
    f.close()
    
    
def adder_with_a_0(n_bits):
    
    n_gates = n_bits
    n_wires = n_bits*3

    # creating file mult_1_bit
    file_name = './'+str(n_bits)+'bit_adder_with_a_0.casm'
    f = open(file_name, 'w')
    
    f.write(str(n_gates)+' '+str(n_wires))
    f.write('\n')
    f.write('2 '+str(n_bits)+' '+str(n_bits))
    f.write('\n')
    f.write('1 '+str(n_bits))
    for i in range(n_bits):
        f.write('\n')
        f.write('2 1 '+str(i)+' '+str(n_bits+i)+' '+str(n_bits*2+i)+' ./or.txt')
         
    f.close()
